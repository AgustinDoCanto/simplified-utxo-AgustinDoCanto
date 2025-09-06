import { Transaction, TransactionInput } from './types';
import { UTXOPoolManager } from './utxo-pool';
import { verify } from './utils/crypto';
import {
  ValidationResult,
  ValidationError,
  VALIDATION_ERRORS,
  createValidationError
} from './errors';
import { TransactionBuilder } from './transaction-builder';



const providedZeroAmountInputs = (transaction: Transaction, utxoPool : UTXOPoolManager): boolean => {
  return transaction.inputs.every(input => {   
        const inputUTXO = utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
        return inputUTXO !== null && inputUTXO.amount === 0; 
    });
};


const verifyZeroAmountOutputs = (transaction: Transaction, utxoPool : UTXOPoolManager): boolean => {
  return transaction.outputs.some(output => output.amount === 0);
};



// 1. Verify the existence of UTXO
// It receives the entries of the transaction and validates that reference to existing, unespent UTXOs 
const verifyExistenceOfUTXO = (transaction: Transaction, utxoPool : UTXOPoolManager): boolean  => {
    const transactionInputs = transaction.inputs;
    
    let verifyExisteceOfUTXOinPool = transactionInputs.every(input => {
        const inputUTXOTransactionId = input.utxoId.txId;
        const outputUTXOTransactionIndex = input.utxoId.outputIndex;
        const utxo = utxoPool.getUTXO(inputUTXOTransactionId, outputUTXOTransactionIndex);
        return utxo !== null;
    });
    
    return verifyExisteceOfUTXOinPool;
};


// 2. Verify the the balance of the transaction
// Verifies that the addition of the input amounts are equal to the output amount
const verifyBalance = (transaction: Transaction, utxoPool: UTXOPoolManager): boolean => {
  const inputSum = transaction.inputs.reduce((acc, input) => {
    const utxo = utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    return utxo ? acc + utxo.amount : acc;
  }, 0);

  const outputSum = transaction.outputs.reduce((acc, output) => acc + output.amount, 0);

  return inputSum === outputSum;
};

// 3. Verify the signatures of UTXO
// Verifies that all inputs are signed by the owner of the UTXOs 
const verifySignatures = (transaction: Transaction, utxoPool: UTXOPoolManager): boolean => {
  const transactionInputs = transaction.inputs;
  const transactionData = JSON.stringify({
    id: transaction.id,
    inputs: transaction.inputs.map(input => ({
      utxoId: input.utxoId,
      owner: input.owner
    })),
    outputs: transaction.outputs,
    timestamp: transaction.timestamp
  });

  return transactionInputs.every(input => {
    const utxo = utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    if (!utxo) return false;
    
    return verify(transactionData, input.signature, utxo.recipient);
  });
};


export class TransactionValidator {
  constructor(private utxoPool: UTXOPoolManager) {}

  /**
   * Validate a transaction
   * @param {Transaction} transaction - The transaction to validate
   * @returns {ValidationResult} The validation result
   */
  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: ValidationError[] = [];

    // STUDENT ASSIGNMENT: Implement the validation logic above
    
    // Verify if provided zero amounts inputs => if true then push an error
    if(providedZeroAmountInputs(transaction, this.utxoPool)){
        errors.push(createValidationError(VALIDATION_ERRORS.EMPTY_INPUTS, "The transaction recieves input UTXOs with amount value zero"));
    }

    if(verifyZeroAmountOutputs(transaction, this.utxoPool)){
        errors.push(createValidationError(VALIDATION_ERRORS.EMPTY_OUTPUTS, "The transaction generates outputs UTXOs with amount value zero"));
    }


    // 1. Existence of UTXOs
    if (!verifyExistenceOfUTXO(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.UTXO_NOT_FOUND, "The specified UTXOs for spent were not found"));
    }

    // 2. Balance
    if (!verifyBalance(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.AMOUNT_MISMATCH, "The addition of the input amounts are not equal to the output amount"));
    }

    // 3. Signatures
    if (!verifySignatures(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.INVALID_SIGNATURE, "There are some issues in the signature or signatures provided"));
    }

    // 4. Double-spending within the same transaction
    const seen = new Set<string>();
    for (const input of transaction.inputs) {
        const key = `${input.utxoId.txId}:${input.utxoId.outputIndex}`;
        if (seen.has(key)) {
        errors.push(createValidationError(VALIDATION_ERRORS.DOUBLE_SPENDING, "You are trying to reference the same UTXO for spent multiple times"));
        break;
        }
        seen.add(key);
    }
  
    return {
    valid: errors.length === 0,
    errors
  };  

  }

  /**
   * Create a deterministic string representation of the transaction for signing
   * This excludes the signatures to prevent circular dependencies
   * @param {Transaction} transaction - The transaction to create a data for signing
   * @returns {string} The string representation of the transaction for signing
   */
  private createTransactionDataForSigning_(transaction: Transaction): string {
    const unsignedTx = {
      id: transaction.id,
      inputs: transaction.inputs.map(input => ({
        utxoId: input.utxoId,
        owner: input.owner
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    return JSON.stringify(unsignedTx);
  }
}
