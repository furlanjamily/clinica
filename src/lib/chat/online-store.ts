/** Mapa in-memory de usuários online — substituível por Redis sem alterar a API pública. */
class OnlineStore {
  private readonly connections = new Map<string, Set<string>>()

  addConnection(userId: string, socketId: string): void {
    const set = this.connections.get(userId) ?? new Set<string>()
    set.add(socketId)
    this.connections.set(userId, set)
  }

  removeConnection(userId: string, socketId: string): void {
    const set = this.connections.get(userId)
    if (!set) return
    set.delete(socketId)
    if (set.size === 0) this.connections.delete(userId)
  }

  isOnline(userId: string): boolean {
    return this.connections.has(userId)
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.connections.keys())
  }
}

export const onlineStore = new OnlineStore()
