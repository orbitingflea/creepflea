/**
 * 本文件仅在代码加载时被执行一次，用于整个系统的初始化。
 * 这个文件会定义 hooks、挂载 hooks，以及调用其他模块的初始化程序。
 */

global.tickBeginHook = [];
global.tickEndHook = [];