import { isUndefined } from "lodash";
import { Observable } from "rxjs/Observable";
import * as Web3 from "web3";

import { EventFunction, TxDataBase, TypedEventFilter } from "../types";

export function findEvent<T = any>(tx: any, eventName: string): Web3.DecodedLogEntry<T> {
  return tx.logs.find((log: any) => log.event === eventName);
}

export function is0x0Address(address: string): boolean {
  return address === "0x0" || address === "0x0000000000000000000000000000000000000000";
}

export function isContract<T extends Web3.ContractInstance>(what: any): what is T {
  return (what as T).abi !== undefined;
}

export function isDecodedLog<T>(what: Web3.LogEntry | Web3.DecodedLogEntry<T>): what is Web3.DecodedLogEntry<T> {
  return (typeof (what as any).event === "string") && !isUndefined((what as any).args);
}

// TODO(ritave): Think how to solve race condition in filters, concat get/watch perhaps?
export function streamifyEvent<A>(original: EventFunction<TypedEventFilter<A>>)
: (paramFilters?: TypedEventFilter<A>, filterObject?: Web3.FilterObject) => Observable<Web3.DecodedLogEntryEvent<A>> {
  return (paramFilters?: TypedEventFilter<A>, filterObject?: Web3.FilterObject) => {
    return new Observable((subscriber) => {
      const filter = original(paramFilters, filterObject);
      let errored = false;
      filter.watch((err, event) => {
        if (err) {
          errored = true;
          return filter.stopWatching(() => subscriber.error(err));
        }
        subscriber.next(event as Web3.DecodedLogEntryEvent<A>);
      });

      return () => {
        if (!errored) {
          filter.stopWatching(() => subscriber.complete());
        }
      };
    });
  };
}

export function isTxData(data: any): data is TxDataBase {
  return data.gas !== undefined ||
    data.gasPrice !== undefined ||
    data.nonce !== undefined ||
    data.from !== undefined ||
    data.value !== undefined ||
    data.to !== undefined;
}
