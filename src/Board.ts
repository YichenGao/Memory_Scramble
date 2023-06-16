/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'assert';
import fs from 'fs';


enum MOVE {FIRST, SECOND}
/**
 * TODO specification
 * Mutable and concurrency safe.
 */
export class Board {
    // keeps what the player's current move
    private readonly moveNumber: Map<string, MOVE> = new Map<string, MOVE>;
    // Map a player ID string to the card locations that this player holds.
    private readonly playerCards: Map<string, Array<number>> = new Map<string, Array<number>>;
    // keeps track of that if there is change
    private waitChange: Deferred<void> = new Deferred<void>();
    

    // Abstraction function:
    //   AF(width, height, cards) = a board with size 'width' x 'height' and have a card 'cards[i]' on the locaiton
    //                            i of the board, where i = row x width + column represents location (row, column)
    // Representation invariant:
    //   width and height are nonnegative numbers
    //   cards.length = width x height
    //   palyerCards: every key is nonempty, each value has length <= 2
    // Safety from rep exposure:
    //   width, height and cards are pulic. width and height are immutable intgers. cards is mutable. 
    // But the users are never allower to mutate them directly through calling the functions.
    // Therefore these fields are safe from exposure. 
    // The rest of the fields (moveNumber, playerCards, waitChange) are private and users cannot access them.

    /**
     * Make an image with content, owner, status, and control.
     * 
     * @param width a string represents the width of the board
     * @param height a string represents the height of the board
     * @param cards a list represents all the cards on the board
     */
    private constructor(public readonly width: number,
                        public readonly height: number,
                        public readonly cards: ReadonlyArray<Card>) {
        this.checkRep();
    }

    // checks the representation of Board.
    private checkRep(): void {
        //   width and height are nonnegative integers
        if(this.width < 0 || this.height < 0){
            throw Error("width and height should be nonnegative!");
        }
        //   cards.length = width x height
        if(this.cards.length !== this.width * this.height){
            throw Error("number of cards should be equal to the size of the board!");
        }

        //   palyerCards: every key is nonempty, each value has length <= 2
        for (const cardPair of this.playerCards){
            if (cardPair[0].length === 0){
                throw Error("player ID should be nonempty!");
            } 
            if (cardPair[1].length > 2){
                throw Error("player can only control two cards!");
            } 
        }
    }

    /**
     * Tries to flip over a card on the board, following the rules in the ps4 handout.
     * If another player controls the card, then this operation blocks until the flip. 
     * If the player control the card already, then the operation should fail instead.
     * either becomes possible or fails.
     * 
     * @param player a string represents the ID of the player
     * @param location a number represents the location of the card that is selected by the player
     *                  where location i = row x width + column represents location (row, column)
     * @throws an error (rejecting the promise) if the flip operation fails as described 
     *         in the ps4 handout.
     */
    public async flip(player: string, location:number): Promise<void>{
        this.checkRep();
        // if the player is playing for the first time, it is first move
        if(!this.moveNumber.has(player)){
            await this.firstFlip(player, location, true);
        // if the player is doing first move, not a new player
        } else if (this.moveNumber.get(player) === MOVE.FIRST){
            await this.firstFlip(player, location, false);
        // if the player is doing second move
        }else {
            this.secondFlip(player, location);
        }
    }

    /**
     * Update the ADT according to the rule, in the situation when fliping a first card.
     * 
     * @param player a string represents the ID of the player
     * @param location a number represents the location of the card that is selected by the player
     *                  where location i = row x width + column represents location (row, column)
     * @param newplayer a boolean remain true if it's a nre player doing a first move
     * @throws Error if the some necessary information is missing
     */
    private async firstFlip(player: string, location:number, newplayer: boolean): Promise<void> {
        this.checkRep();
        // if not first play, need to update tule 3A and 3B
        if((!newplayer) && this.playerCards.get(player)?.length !== 0){
            // 3-A If they had turned over a matching pair, they control both cards. 
            // Those cards are removed from the board, and they relinquish control of them. 
            const cardPairs: Array<number> = this.playerCards.get(player)?? assert.fail();
            const firstCardLocation: number = cardPairs[0]?? assert.fail();
            const secondCardLocation: number = cardPairs[1]?? assert.fail();
            // get two cards based on location
            const firstCard: Card = this.cards[firstCardLocation]?? assert.fail();
            const secondCard: Card = this.cards[secondCardLocation]?? assert.fail();
            if(firstCard.content === secondCard.content){
                // remove cards if they are matching
                firstCard.status = STATUS.NONE;
                secondCard.status = STATUS.NONE;
                firstCard.owner = "";
                firstCard.control.resolve();
                firstCard.control = new Deferred<void>();
                secondCard.owner = "";
                secondCard.control.resolve();
                secondCard.control = new Deferred<void>();

                this.waitChange.resolve();
                this.waitChange = new Deferred<void>();
            } else{
            // 3-B Otherwise, they had turned over one or two non-matching cards, and 
            // relinquished control but left them face up on the board. 
            // For each of those card(s), if the card is still on the board, currently face up, 
            // and currently not controlled by another player, the card is turned face down.
                if(firstCard.owner === "" && firstCard.status === STATUS.UP){
                    firstCard.status = STATUS.DOWN;
                }
                if(secondCard.owner === "" && secondCard.status === STATUS.UP){
                    secondCard.status = STATUS.DOWN;
                }

                // if either card is fliped down then it is a change
                if(firstCard.status === STATUS.DOWN || secondCard.status === STATUS.DOWN){
                    this.waitChange.resolve();
                    this.waitChange = new Deferred<void>();
                }
            }
            this.playerCards.set(player, []);


        }

        const cardChosen: Card = this.cards[location]?? assert.fail();
        // 1-A If there is no card there (the player identified an empty space, perhaps because the 
        // card was just removed by another player), the operation fails.
        if(cardChosen.status === STATUS.NONE){
            this.moveNumber.set(player, MOVE.FIRST);
            this.playerCards.set(player, []);
            throw Error("cannot select none!");
        }else if (cardChosen.status === STATUS.DOWN){
        // 1-B If the card is face down, it turns face up (all players can now see it) 
        // and the player controls that card.
            cardChosen.status = STATUS.UP;
            cardChosen.owner = player;
            this.moveNumber.set(player, MOVE.SECOND);
            this.playerCards.set(player, [location]);

            this.waitChange.resolve();
            this.waitChange = new Deferred<void>();
        } else if(cardChosen.status === STATUS.UP && cardChosen.owner === ""){
        // 1-C If the card is already face up, but not controlled by another player, 
        // then it remains face up, and the player controls the card.
            cardChosen.owner = player;
            this.moveNumber.set(player, MOVE.SECOND);
            this.playerCards.set(player, [location]);
        }else{// 1-D And if the card is face up and controlled by another player, the operation blocks. 
            // The player will contend with other players to take control of the card at the next opportunity.
            await cardChosen.control.promise;
            await this.firstFlip(player, location, newplayer);
        }
    }

    /**
     * Update the ADT according to the rule, in the situation when fliping a second card.
     * 
     * @param player a string represents the ID of the player
     * @param location a number represents the location of the card that is selected by the player
     *                  where location i = row x width + column represents location (row, column)
     * @throws Error if the some necessary information is missing
     */
    private secondFlip(player: string, location:number): void {
        this.checkRep();
        const cardChosen: Card = this.cards[location]?? assert.fail();
        const cardPairs: Array<number> = this.playerCards.get(player)?? assert.fail();
        const firstCardLocation: number = cardPairs[0]?? assert.fail();
        // get two cards based on location
        const firstCard: Card = this.cards[firstCardLocation]?? assert.fail();

        if(cardChosen.status === STATUS.NONE){
            // 2-A If there is no card there, the operation fails. The player also relinquishes
            // control of their first card (but it remains face up for now).
            this.playerCards.set(player, []);
            firstCard.owner = "";
            firstCard.control.resolve();
            firstCard.control = new Deferred<void>();
            throw Error("cannot select none!");
        } else if(cardChosen.status === STATUS.UP && cardChosen.owner !== ""){
            // 2-B If the card is face up and controlled by a player (another player or themselves),
            // the operation fails. To avoid deadlocks, the operation does not block. 
            // The player also relinquishes control of their first card (but it remains face up for now).
            this.playerCards.set(player, []);
            firstCard.owner = "";
            firstCard.control.resolve();
            firstCard.control = new Deferred<void>();
            throw Error("the card is controlled!");
        } else{
            // If the card is face down, or if the card is face up but not controlled by a player, then:
            if(cardChosen.status === STATUS.DOWN){
                // 2-C If it is face down, it turns face up.
                cardChosen.status = STATUS.UP;

                this.waitChange.resolve();
                this.waitChange = new Deferred<void>();
            }

            if(cardChosen.content === firstCard.content){
                // 2-D If the two cards are the same, that’s a successful match! 
                // The player keeps control of both cards (and they remain face up on the board for now).
                cardChosen.owner = player;
                this.playerCards.get(player)?.push(location);
                cardChosen.owner = player;
            } else{
                // 2-E If they are not the same, the player relinquishes control of both cards 
                // (again, they remain face up for now).
                this.playerCards.get(player)?.push(location);
                firstCard.owner = "";
                firstCard.control.resolve();
                firstCard.control = new Deferred<void>();
            }
        }
        this.moveNumber.set(player, MOVE.FIRST);
    }

    
    /**
     * Make a new board by parsing a file.
     * 
     * PS4 instructions: the specification of this method may not be changed.
     * 
     * @param filename path to game board file
     * @returns (a promise for) a new board with the size and cards from the file
     * @throws Error if the file cannot be read or is not a valid game board
     */
    public static async parseFromFile(filename: string): Promise<Board> {
        const file: Array<string> = (await fs.promises.readFile(filename, {encoding: "utf8"})).split(/[\r]?\n/);
        const size = file[0]?.split("x"); // size = [width, height]
        const cards: Array<Card> = new Array<Card>;
        for (let i = 1; i < file.length - 1; i++){
            const content = file[i];
            if(content){
                cards.push(new Card(content, "", STATUS.DOWN, new Deferred<void>()));
            }
        }

        let width = -1;
        let height = -1;
        if(size){
            const x = size[0];
            const y = size[1];
            if(x && y){
                width = parseInt(x);
                height = parseInt(y);
            }
        }
        return new Board(width, height, cards) ?? assert("not a valid board!"); 
    }

    /**
     * care a stirng shows the state of the board from the player’s perspective according to the grammar
     * 
     * @param playerId a player ID
     * @returns a string showing the current state of the board from the player’s perspective
     */
    public look(playerId: string): string {
        this.checkRep();
        let str: string = this.width + "x" + this.height + "\n";
        for (const card of this.cards){
            if(card.owner === playerId && card.status !== STATUS.NONE){
                // player control the card
                str += "my " + card.content + "\n";
            } else if (card.status === STATUS.UP){
                // card is faced up on the board
                str += "up " + card.content + "\n";
            } else if(card.status === STATUS.DOWN){
                // card is facing down
                str += "down" + "\n";
            }else{
                // card is not on the board
                str += "none" + "\n";
            }
        }
        return str;
    }

    /**
 * Modifies board by replacing every card with f(card), without affecting other state of the game.
 * 
 * This operation must be able to interleave with other operations (e.g. look() should not 
 * block while a map() is in progress), but the board must remain observably consistent for 
 * players: if two cards on the board match each other before map() is called, then it must not
 * be possible for any player to observe a board state in which that pair of cards do not match.
 *
 * f must be a pure function from cards to cards: 
 * given some legal card `c`, f(c) should be a legal replacement card which is consistently 
 * the same every time f(c) is called for that same `c`.
 * 
 * @param playerId ID of player applying the map; 
 *                 must be a nonempty string of alphanumeric or underscore characters
 * @param f pure function from cards to cards
 * @returns the state of the board after the replacement, in the format 
 *          described in the ps4 handout
 */
    public async map(playerId: string, f: (card: string) => Promise<string>): Promise<string> {
        this.checkRep();
        const contents: Array<string> = new Array<string>();
        // get all the unique card content in cards
        for (const card of this.cards){
            if(!contents.includes(card.content)){
                contents.push(card.content);
            }
        }
        // map original content to new content
        const contentMap: Map<string, string> = new Map<string, string>();
        for (const oldContent of contents){
            contentMap.set(oldContent, await f(oldContent));
        }
        // update cards using the new content
        for (const card of this.cards){
            card.content = contentMap.get(card.content) ?? assert.fail();
        }
        
        let isChange: boolean = false;
        // This is not a change if every string is mapped to itself
        for(const contentPair of contentMap){
            if(contentPair[0] !== contentPair[1]){
                isChange = true;
            }
        }
        if(isChange){
            this.waitChange.resolve();
            this.waitChange = new Deferred<void>();
        }
        return this.look(playerId);
    }

    // return a string represent the Board
    public toString(): string {
        let str: string = this.width + "x" + this.height + "\n";
        for (const card of this.cards){
            str += card.toString() + "\n";
        }
        return str;
    }

    /**
     * Watches the board for a change, blocking until any cards turn face up or face down, 
     * are removed from the board, or change from one string to a different string.
     *
     * @param playerId ID of player watching the board; 
     *                 must be a nonempty string of alphanumeric or underscore characters
     * @returns the state of the board, in the format described in the ps4 handout
     */
    public async watch(playerId: string): Promise<string>{
        this.checkRep();
        await this.waitChange.promise;
        return this.look(playerId);
    }
    
}

// the status of a card, if the card is faced up, its status is UP. 
// if the card is faced down, its status is DOWN. 
// if the card is removed from the board, its status is NONE.
enum STATUS {NONE, DOWN, UP}

export class Card {
    // Abstraction function
    //    AF(content, owner, status, control) = a card with 'content', and is in a status of 'status',
    //                          and is controlled by 'owner', hold a promise 'control'
    // Rep invariant
    //    the card is UP iff there is an owner
    // Safety from rep exposure
    //    content is readonly.
    //    owner, status, and control fields are reassignable but they are immutable
    
    /** Make an image with content, owner, status, and control. */
    public constructor(public content: string,
                        public owner: string,
                        public status: STATUS,
                        public control: Deferred<void>) {
        this.checkRep();
    }

    // check the representaiton of a Card
    private checkRep(): void {
        // the card is UP is there is an owner
        if(this.owner !== "" && this.status !== STATUS.UP){
            throw Error("owner should be empty if status is not my");
        }
    }

    // return a string represent the Card
    public toString(): string {
        return "content: " + this.content + " owner: " + this.owner + " status:" + this.status + " control: " + this.control;
    }

}


// the code is from: http://web.mit.edu/6.102/www/sp23/classes/16-mutual-exclusion/code.html#deferredts
type Resolver<T> = (value: T | PromiseLike<T>) => void;
type Rejector = (reason: Error) => void;

/** Deferred represents a promise plus operations to resolve or reject it. */
export class Deferred<T> {

  /** The promise. */
  public readonly promise: Promise<T>;

  /** Mutator: fulfill the promise with a value of type T. */
  public readonly resolve: Resolver<T>;

  /** Mutator: reject the promise with an Error value. */
  public readonly reject: Rejector;
  
  /** Make a new Deferred. */
  public constructor() {
    let resolve: Resolver<T> | undefined;
    let reject: Rejector | undefined;

    this.promise = new Promise<T>((res: Resolver<T>, rej: Rejector) => {
      resolve = res;
      reject = rej;
    });

    // TypeScript's static checking doesn't know for sure 
    // that the Promise constructor callback above is called synchronously,
    // so assert that resolve and reject have indeed been initialized by this point
    assert(resolve);
    assert(reject);
    this.resolve = resolve;
    this.reject = reject;
  }

}
