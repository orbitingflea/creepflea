interface Creep {
  cache: CreepCache;
  hasCache: boolean;
}

interface CreepCache extends RoomObjectCache {

}

interface Room {
  cache: RoomCache;
}

interface RoomCache {

}

interface RoomObject {
  cache: RoomObjectCache;
  hasCache: boolean;
}

interface RoomObjectCache {}
