# Aclaraciones
AGUSTIN DO CANTO - 250230

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
export interface UtxoId {
  txId: string;
  outputIndex: number;
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

Esta funcion **genera un identificador único en formato string para un UTXO**, el mismo se puede utilizar como clave en una UTXOpool


## UTXOPoolManager FUNCIONES:




La Pool es como una bolsa donde se guardan todos los UTXOs

### addUTXO - Agrega un UTXO a la Pool
### removeUTXO - Elimina un UTXO de la Pool 
### getUTXO - Obtiene un UTXO de la pool
### getAllUTXOs - Obtiene todos los UTXOs de la Pool
### getUXOsForOwner -
### getBalance -
### processTransaction -
### createGenesisUTXOs -
### clone -