class Matcher<A, B> {
    pairs: Record<string, [A | undefined, B | undefined]>

    constructor() {
        this.pairs = {}
    }

    addLeft(key: string, left: A) {
        if(!this.pairs[key]) {
            this.pairs[key] = [left, undefined]
        }else if(this.pairs[key][0] === undefined) {
            this.pairs[key][0] = left
        }
    }

    addRight(key: string, right: B) {
        if(!this.pairs[key]) {
            this.pairs[key] = [undefined, right]
        }else if(this.pairs[key][1] === undefined) {
            this.pairs[key][1] = right
        }
    }

    getMatchedEntries(): [string, A, B][] {
        return Object.entries(this.pairs).flatMap(([key, [left, right]]) => {
            if(left && right) {
                return [[key, left, right]]
            } 
            return []
        })
    }

    getUnmatchedLeft(): [string, A][] {
        return Object.entries(this.pairs).flatMap(([key, [left, right]]) => {
            if(left && !right) {
                return [[key, left]]
            } 
            return []
        })
    }

    getUnmatchedRight(): [string, B][] {
        return Object.entries(this.pairs).flatMap(([key, [left, right]]) => {
            if(!left && right) {
                return [[key, right]]
            } 
            return []
        })
    }

}

export default Matcher;