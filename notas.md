# Notas
AGUSTIN DO CANTO - 250230

## Clave pública y clave privada

Los usos de la claves son los siguientes:

| Clave | Uso |
|:-----:|:---:|
| Pública | Recibir fondos / Verificar firmas |
| Privada | Firmar transacciones (secreta) |

1. **Clave Privada** 

- Es secreta y solo debe conocerla el propietario.
- Se usa para firmar transacciones, validando que sos el dueño de los fondos.
- Con la firma digital, nadie puede falsificar que enviaste una transacción (ya que nadie debería conocer tu clave privada).

**Ejemplo:**

Si Bob quiere enviar 3 monedas a Alice, usa su clave privada para firmar la transacción:

```typescript
const signature = signTransaction(tx, bob.privateKey);
```

La firma garantiza que solo Bob pudo crear esa transacción.

2. **Clave Pública**

- Es pública y puede compartirse con otros.
- Permite que cualquiera verifique la firma de la transacción.
- También sirve como identificador del destinatario de fondos (como un “número de cuenta”).

**Ejemplo:**

Cuando Alice recibe los fondos:

```typescript
verifyTransactionSignature(tx, bob.publicKey);
```

> **Nota:** Tx es la abreviación de Transaction (o transacción).

3. Relación Clave Privada <-> Clave Pública

- Siempre se genera un par único: privateKey → publicKey.
- La clave pública se crea a partir de la privada. Pero la clave privada no se puede obtener a través de la pública esto garantiza seguridad y autenticidad.

4. En blockchain/UTXO

- Cada UTXO tiene un destinatario, que es la clave pública del dueño.
- Para gastar ese UTXO, necesitas firmar con la clave privada correspondiente.
- La red verifica la firma usando la clave pública almacenada en el UTXO.


## UTXO

Un UTXO son las siglas de Unspent Transaction Output.

Cuando se realiza una transacción (compro algo, cambio algo, etc) hago referencia a un UTXO, que es el que me valida que tengo la plata para comprar esos son los inputs.

Luego para comprar (si tengo la plata) efectuo la transacción, es decir, el UTXO que decia que tenía cierta cantidad de plata, se elimina, y se crean uno o más UTXOs de salida donde se indicara, quien o quienes fueron que recibieron la plata, cual es el cambio y quien o quienes lo recibieron (en caso de haber cambio).

En resumen el ciclo de vida de una transaccion seria algo asi:

Genesis:
Antes de hacer transacciones cargo la pool con todos los UTXOs diciendo cuanta plata, creditos, saldo, etcétera tienen inicalmente cada uno.

Transaccion (Pseudocodigo):
```
    inputs = referencioInputs
    outputs referencioOutpus
    nuevaTransaccion = Transaccion(inputs, outputs) // creo el objeto transaccion (sin ID porque todavía no la hice)

    if  transaccionValida(nuevaTransaccion):
        efectuarTransaccion(nuevaTransaccion)
    else:
        error "La transaccion no es valida" // Aca se indica el tipo de error, balance, uso UTXOs existentes o no gastados, firmas validas, sin doble gasto en transacciones (no efectuo dos veces la misma transaccion)
```

## Archivo Types.ts

## TransactionInput

Un TransactionInput tiene:
    - **utxoId** que contiene un id de transaccion (txId : string) y un index de salida (outputIndex : number)  
    - **owner** : string que coniene la public key del dueño del UTXOs
    - **signature** : string   

> **Nota**: El outputIndex sirve para indicar el indice en el la lista de salida de la transacción.


## TransactionOuput

Un TransactionOutput tiene:
    - **amount** que contiene un id de transaccion (txId : string) y un index de salida (outputIndex : number)  
    - **recipient** : string clave publica del que recibe los UTXO

## UTXO

UTXO extiende de TransactionOutput (hereda sus campos) y contine lo siguiente:
    - **id** : UtxoId
    - **amount** : string
    - **recipient** : string

> **Nota**: el UtxoId contiene el txtId y outputIndex

```typescript
export interface TransactionOutput {
  amount: number;
  recipient: string; // public key of the recipient
}

export interface UtxoId {
  txId: string;
  outputIndex: number;
}

export interface UTXO extends TransactionOutput {
  id: UtxoId;
}
```

## Transaction 

Una transaccion tiene:
    - **id** (identificador de la transaccion, que se asigna despues de efectuarla)
    - **TransactionInputs** una lista de INPUTS (referencia a de donde entra la plata)
    - **TransactionOutputs** una lista de OUTPUT (referencia a donde se va la plata)
    - **timestamp** (indica cuando se creo la transaccion - fecha en generalmente en milisegundos desde el 1 de enero de 1970 (Unix epoch) - es el DateTime)


El timestamp sirve si dos transacciones intentan gastar el mismo UTXO al mismo tiempo, porque no hay que olvidar que en un sistema real todo esto ocurre paralelamente (como en sistemas operativos), es decir, dos maquinas (o procesos) distintas pueden querer hacer la misma transaccion al mismo tiempo y se generan conflictos o condiciones de carrera que deben resolverse para que el balance (la plata), siempre sea la misma y no se cree ni se destruya por errores de concurrencia. Asi se evitan transacciones fraudulentas.

### Funciones del archivo types.ts

El archivo types.ts tambien provee la funcion **getUTXOKey** con tres sobrecargas (maneras distintas de llamar a la funcion).

Esta funcion **genera un identificador único en formato string para un UTXO**, el mismo se puede utilizar como clave en una UTXOpool o como id


## UTXOPoolManager FUNCIONES:


La Pool es como una bolsa donde se guardan todos los UTXOs

### addUTXO - Agrega un UTXO a la Pool
Recibe un UTXO:

```typescript
addUTXO(utxo: UTXO): void {
    const key = getUTXOKey(utxo.id);
    this.#pool[key] = utxo;
}
```
### removeUTXO - Elimina un UTXO de la Pool 

```typescript
  removeUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    const utxo = this.#pool[key];
    if (utxo) {
      delete this.#pool[key];
      return utxo;
    }
    return null;
  }
```
### getUTXO - Obtiene un UTXO de la pool

```typescript
getUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    return this.#pool[key] || null;
}
```
### getAllUTXOs - Obtiene (retorna) todos los UTXOs de la Pool

```typescript
 getAllUTXOs(): UTXO[] {
    return Object.values(this.#pool);
  }
```

### getUXOsForOwner - Obtiene (retorna) todos los UTXOs de un propietario

Se indica la clave publica del dueño de los UTXOs y se retornan todos los UTXOs que la clave publica del receptor (recipiente) coincidan con la clave provista:

```typescript
getUTXOsForOwner(publicKey: string): UTXO[] {
    return this.getAllUTXOs().filter(utxo => utxo.recipient === publicKey);
}
```
### getBalance - Obtiene (retorna) el balance de un Propietario

Funcionamiento: Recorre la Pool entera encontrando los que coinciden con la clave publica provista y sumando el valor de cada UTXO en un acumulador.

> Nota para el profesor: Si la pool tiene millones y millones de UTXOs la función deja de funcionar ya que seria muy lento recorrer todas la inmensa cantidad de transacciones y se deberían buscar mejores mecanismos de búsqueda que solucionen esto.
>
> Algunas soluciones existentes a esta problemática son:

- Mantener un indice por propietario
- Cachear los balances
- Tener una base de datos optimizada para este tipo de busqueda
- Sharding (dividir la pool en partes manejables)

La mejor opción (a mi parecer) al tratarse de un sistema descentralizado es utilzar Sharding o Cache ya que cada wallet podria encargarse de almacenar el balance para así encontrarlo en O(1) (porque lo almacena) o una combinación de las tácticas presentadas. 

```typescript
  /**
   * Get the balance of an owner
   * @param {string} publicKey - The public key of the owner
   * @returns {number} The balance of the owner
   */
  getBalance(publicKey: string): number {
    // 💡 If you're reading this, dear student, you might want to think whether this is
    // makes sense in the context of a real blockchain, where we have lots and lots of UTXOs.
    return this.getUTXOsForOwner(publicKey).reduce((total, utxo) => total + utxo.amount, 0);
  }
```

### processTransaction - Efectua la transaccion recibida

- Recibe una transacción y remueve los inputs de la pool
- Crea los UTXOs correspondientes a los outputs y los añade a la pool

> NOTA: Es muy IMPORTANTE validar que la transacción sea correcta antes de efectuarla, ya que es una acción destructiva y podría dañar el balance de la pool de no efectuarse correctamente, haciendo que se cree plata o destruya. La validación (propósito de este entrega) se encuentra en [transaction-validator.ts](./src/transaction-validator.ts)

```typescript
  /**
   * Process a transaction
   * @param {Transaction} transaction - The transaction to process
   */
  processTransaction(transaction: Transaction): void {
    for (const input of transaction.inputs) {
      this.removeUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    }

    for (let i = 0; i < transaction.outputs.length; i++) {
      const output = transaction.outputs[i];
      const newUTXO: UTXO = {
        id: {
          txId: transaction.id,
          outputIndex: i
        },
        amount: output.amount,
        recipient: output.recipient
      };
      this.addUTXO(newUTXO);
    }
  }
```

### createGenesisUTXOs - Inicializa el balance de los propietarios en la Pool

Se le indican los propietarios, sus balances y luego crea los UTXOs correspondientes agregandolos en la pool.

```typescript
  /**
   * Create genesis UTXOs
   * @param {Object} initialBalances - The initial balances of the owners
   */
  createGenesisUTXOs(initialBalances: { [publicKey: string]: number }): void {
    const genesisId = 'genesis';
    let outputIndex = 0;

    for (const [publicKey, amount] of Object.entries(initialBalances)) {
      const utxo: UTXO = {
        id: {
          txId: genesisId,
          outputIndex
        },
        amount,
        recipient: publicKey
      };
      this.addUTXO(utxo);
      outputIndex++;
    }
  }
```

### clone - Clona el Pool manager

Clona y retorna una copia del pool manager. Sirve para realizar tests o acciones que no impacten directamente sobre la pool original.

> **Nota para el profesor:** Esta accion debe es muy costosa si se tienen muchos UTXOs en la Pool.

```typescript
  /**
   * Clone the UTXO pool manager
   * @returns {UTXOPoolManager} A new UTXO pool manager with the same UTXOs
   */
  clone(): UTXOPoolManager {
    const newManager = new UTXOPoolManager();
    newManager.#pool = { ...this.#pool };
    return newManager;
  }
```

## TransactionBuilder - Creador de transacciones

La clase TransactionBuilder contiene un unico metodo el cual es 

```typescript
static createTransaction(
        inputs: { utxo: UTXO; privateKey: string }[],
        outputs: TransactionOutput[] 
    ): Transaction; 
```

El mismo recibe una lista de inputs con los UTXOs y la clave privada de sus propietarios, una lista de transacciones de salida y retorna una transaccion nueva con las transacciones de entrada firmadas por la clave privada.

En resumen: Recibe una los inputs para una transaccion, la crea, firma y retorna. 


## Crypto.ts

Contiene funciones relacionadas a la clave publica, privada, firmas y verificaciones:

### generateKeyPair - Genera un par de claves Publica y Privada

```typescript
/**
 * Generate a key pair using elliptic curve cryptography (secp256k1 - Bitcoin style)
 * @returns {KeyPair} The generated key pair
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    publicKey: publicKey.toString(),
    privateKey: privateKey.toString()
  };
}
```

## sign - Firma una entrada con la clave privada

```typescript
/**
 * Sign data with a private key
 * @param {string} data - The data to sign
 * @param {string} privateKey - The private key to use for signing (PEM format)
 * @returns {string} The signature (hex format)
 */
export function sign(data: string, privateKey: string): string {
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(data, 'utf8');
    sign.end();
    return sign.sign(privateKey, 'hex');
  } catch (error) {
    throw new Error(
      `Failed to sign data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

## verify - Verifica una firma

Recibe:

- **data**: Datos a verificar la firma
- **signature**: La firma a verificar en formato hexadecimal 
- **publicKey**: La firma a usar para la verificacion en formato PEM.

Y retorna un boleano true si la firma es valida y false si no.

```typescript
/**
 * Verify a signature
 * @param {string} data - The data to verify
 * @param {string} signature - The signature to verify (hex format)
 * @param {string} publicKey - The public key to use for verification (PEM format)
 * @returns {boolean} Whether the signature is valid
 */
export function verify(data: string, signature: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data, 'utf8');
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  } catch (error) {
    return false;
  }
}
```

## hash - Devuelve el hash de los datos proporcionados

Se le proporciona datos en forma de string, los "hashea" y retorna

```typescript
/**
 * Hash data using SHA-256
 * @param {string} data - The data to hash
 * @returns {string} The hash (hex format)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
```