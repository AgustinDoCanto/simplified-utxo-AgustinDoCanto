import { Transaction, TransactionInput } from './types';
import { UTXOPoolManager } from './utxo-pool';
import { verify } from './utils/crypto';
import {
  ValidationResult,
  ValidationError,
  VALIDATION_ERRORS,
  createValidationError
} from './errors';


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


// 2. Verify the the balnace of the transaction
// Verifies that the addition of the input amounts are equal to the output amount
const verifyBalance = (transaction: Transaction, utxoPool: UTXOPoolManager): boolean => {
  const inputSum = transaction.inputs.reduce((acc, input) => {
    const utxo = utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    return utxo ? acc + utxo.amount : acc;
  }, 0);

  const outputSum = transaction.outputs.reduce((acc, output) => acc + output.amount, 0);

  return inputSum === outputSum;
};

// 3. Verify the existence of UTXO
// Verifies that all inputs are signed by the owner of the UTXOs 
const verifySignatures = (transaction: Transaction, utxoPool: UTXOPoolManager): boolean => {
  const data = JSON.stringify({
    id: transaction.id,
    inputs: transaction.inputs.map(input => ({ utxoId: input.utxoId, owner: input.owner })),
    outputs: transaction.outputs,
    timestamp: transaction.timestamp
  });

  return transaction.inputs.every(input => {
    const utxo = utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    if (!utxo) return false;
    return verify(data, input.signature, utxo.owner);
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
    
    // 1. Existence of UTXOs
    if (!verifyExistenceOfUTXO(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.UTXO_NOT_FOUND, "The specified UTXOs for spent were not found"));
    }

    // 2. Balance
    if (!verifyBalance(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.INVALID_BALANCE, "The addition of the input amounts are not equal to the output amount"));
    }

    // 3. Signatures
    if (!verifySignatures(transaction, this.utxoPool)) {
        errors.push(createValidationError(VALIDATION_ERRORS.INVALID_SIGNATURE));
    }

    // 4. Double-spending within the same transaction
    const seen = new Set<string>();
    for (const input of transaction.inputs) {
        const key = `${input.utxoId.txId}:${input.utxoId.outputIndex}`;
        if (seen.has(key)) {
        errors.push(createValidationError(VALIDATION_ERRORS.DOUBLE_SPENDING));
        break;
        }
        seen.add(key);
    }

  return {
    valid: errors.length === 0,
    errors
  };  




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
