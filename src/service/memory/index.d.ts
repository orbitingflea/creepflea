interface Memory {
  roomObjects: {
    [key: string]: RoomObjectMemory;
  };
}

interface RoomObject {
  memory: RoomObjectMemory;
  hasMemory: boolean;
}

interface RoomObjectMemory {

}
