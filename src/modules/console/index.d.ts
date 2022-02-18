export {}

declare global {
  namespace NodeJS {
    interface Global {
      fillTerminal(roomName: string): void;
      NewCarrierTask(roomName: string, from: string, to: string, resourceType: string, amount?: number): void;
      takeTerminal(roomName: string): void;
      keepSell(roomName: string, res: ResourceConstant): void;
      SellResource(roomName: string, res: ResourceConstant, amount: number, price: number): void;
    }
  }
}
