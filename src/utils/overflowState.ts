class OverflowState {
    private hiddenAmounts: Record<string, number> = {};

    getHiddenAmount(key: string): number {
        return this.hiddenAmounts[key] || 0;
    }

    addHiddenAmount(key: string, amount: number) {
        this.hiddenAmounts[key] = (this.hiddenAmounts[key] || 0) + amount;
    }

    clear() {
        this.hiddenAmounts = {};
    }
}

export const overflowState = new OverflowState();
