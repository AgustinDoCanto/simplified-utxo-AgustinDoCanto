import { Transaction, TransactionInput, TransactionOutput } from '../types';

// Extra auxiliar functions declarated for reading strings and numbers

function writeString(bufs: Buffer[], str: string) {
  const strBuf = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(2); // UInt16 -> hasta 65535 chars
  lenBuf.writeUInt16LE(strBuf.length, 0);
  bufs.push(lenBuf, strBuf);
}

function writeNumber(bufs: Buffer[], num: number | bigint) {
  const numBuf = Buffer.alloc(8);
  numBuf.writeBigUInt64LE(BigInt(num));
  bufs.push(numBuf);
}




/**
 * Encode a transaction to binary format for space-efficient storage
 * @param {Transaction} transaction - The transaction to encode
 * @returns {Buffer} The binary representation
 */
export function encodeTransaction(transaction: Transaction): Buffer {
  // BONUS CHALLENGE: Implement binary encoding for transactions
  // This should create a compact binary representation instead of JSON

  // Suggested approach:
  // 1. Use fixed-size fields where possible (e.g., 8 bytes for amounts, timestamps)
  // 2. Use length-prefixed strings for variable-length data (id, signatures, public keys)
  // 3. Use compact representations for counts (e.g., 1 byte for number of inputs/outputs if < 256)


   // IMPLEMENTATION

   // OUTPU BUFFER: in this the array will be the ouput for the input encoded
   const bufs: Buffer[] = [];

    // ID
    writeString(bufs, transaction.id);

    // Timestamp
    writeNumber(bufs, transaction.timestamp);

    // Inputs
    const inputs = transaction.inputs;
    bufs.push(Buffer.from([inputs.length])); // 1 byte count
    for (const input of inputs) {
        writeString(bufs, input.utxoId.txId);

        const indexBuf = Buffer.alloc(4);
        indexBuf.writeUInt32LE(input.utxoId.outputIndex);
        bufs.push(indexBuf);

        writeString(bufs, input.owner);
        writeString(bufs, input.signature);
    }

    // Outputs
    const outputs = transaction.outputs;
    bufs.push(Buffer.from([outputs.length]));
    for (const output of outputs) {
        writeNumber(bufs, output.amount);
        writeString(bufs, output.recipient);
    }

    return Buffer.concat(bufs);
}


// Extra auxiliar functions declarated for reading strings and numbers

function readString(buf: Buffer, offset: number): [string, number] {
  const len = buf.readUInt16LE(offset);
  offset += 2;
  const str = buf.toString('utf8', offset, offset + len);
  return [str, offset + len];
}

function readNumber(buf: Buffer, offset: number): [number, number] {
  const num = Number(buf.readBigUInt64LE(offset));
  return [num, offset + 8];
}



/**
 * Decode a transaction from binary format
 * @param {Buffer} buffer - The binary data to decode
 * @returns {Transaction} The reconstructed transaction object
 */
export function decodeTransaction(buffer: Buffer): Transaction {
  // BONUS CHALLENGE: Implement binary decoding for transactions
  // This should reconstruct a Transaction object from the binary representation

    let offset = 0;

    // ID
    let id; [id, offset] = readString(buffer, offset);

    // Timestamp
    let timestamp; [timestamp, offset] = readNumber(buffer, offset);

    // Inputs
    const numInputs = buffer.readUInt8(offset++);
    const inputs: TransactionInput[] = [];
    for (let i = 0; i < numInputs; i++) {
        let txId; [txId, offset] = readString(buffer, offset);

        const outputIndex = buffer.readUInt32LE(offset);
        offset += 4;

        let owner; [owner, offset] = readString(buffer, offset);
        let signature; [signature, offset] = readString(buffer, offset);

        inputs.push({
        utxoId: { txId, outputIndex },
        owner,
        signature
        });
    }

    // Outputs
    const numOutputs = buffer.readUInt8(offset++);
    const outputs: TransactionOutput[] = [];
    for (let i = 0; i < numOutputs; i++) {
        let amount; [amount, offset] = readNumber(buffer, offset);
        let recipient; [recipient, offset] = readString(buffer, offset);

        outputs.push({ amount, recipient });
    }

    return { id, inputs, outputs, timestamp };
}

/**
 * Compare encoding efficiency between JSON and binary representations
 * @param {Transaction} transaction - The transaction to analyze
 * @returns {object} Size comparison and savings information
 */
export function getEncodingEfficiency(transaction: Transaction): {
  jsonSize: number;
  binarySize: number;
  savings: string;
} {
  const jsonSize = Buffer.from(JSON.stringify(transaction)).length;
  try {
    const binarySize = encodeTransaction(transaction).length; // Transaction encoded in Little Endian
    const savingsPercent = (((jsonSize - binarySize) / jsonSize) * 100).toFixed(1);
    return {
      jsonSize,
      binarySize,
      savings: `${savingsPercent}%`
    };
  } catch {
    return {
      jsonSize,
      binarySize: -1,
      savings: 'Not implemented'
    };
  }
}
