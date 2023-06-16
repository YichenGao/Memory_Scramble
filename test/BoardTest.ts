/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'assert';
import fs from 'fs';
import { Board } from '../src/Board';


/**
 * Tests for the Board abstract data type.
 */
describe('Board', function () {

    it("create 2x2 board from file", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        assert.deepStrictEqual(await testbd.look("hi"), "2x2\ndown\ndown\ndown\ndown\n", "should have same board state");
    });

    it("flip 2 matching, stop", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 1);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nmy A\nmy A\ndown\ndown\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup A\nup A\ndown\ndown\n", "should have same board state");
    });

    it("flip 2 matching, flip again, remove cards", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 1);
        testbd.flip("1", 3);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nnone\nnone\ndown\nmy B\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nnone\nnone\ndown\nup B\n", "should have same board state");
    });

    it("flip 2 not matching, stop", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 2);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nup A\ndown\nup B\ndown\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup A\ndown\nup B\ndown\n", "should have same board state");
    });

    it("flip 2 not matching, stop", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 2);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nup A\ndown\nup B\ndown\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup A\ndown\nup B\ndown\n", "should have same board state");
    });

    it("flip 2 not matching, flip again, turn both cards down", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 2);
        testbd.flip("1", 1);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\ndown\nmy A\ndown\ndown\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\ndown\nup A\ndown\ndown\n", "should have same board state");
    });

    it("flip 2 not matching, flip again, turn both cards down", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 2);
        testbd.flip("1", 0);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nmy A\ndown\ndown\ndown\n", "should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup A\ndown\ndown\ndown\n", "should have same board state");
    });

    const dictionary = new Map<string, string>();
    dictionary.set("A", "x");
    dictionary.set("B", "y");

    it("map", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 1);
        testbd.flip("2", 2);
        testbd.flip("2", 3);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nmy A\nmy A\nup B\nup B\n", "1. should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup A\nup A\nmy B\nmy B\n", "2. should have same board state");
        assert.deepStrictEqual(await testbd.map("1", async (card: string) => dictionary.get(card)?? assert.fail()), "2x2\nmy x\nmy x\nup y\nup y\n", "3. should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nup x\nup x\nmy y\nmy y\n", "4. should have same board state");
    });

    it("pick invalid second card, leave card up, pick up card and down card", async function() {
        const testbd = await Board.parseFromFile("boards/test1.txt");
        testbd.flip("1", 0);
        testbd.flip("1", 1);
        testbd.flip("1", 3);
        testbd.flip("1", 1);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nnone\nnone\ndown\nup B\n", "1. should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nnone\nnone\ndown\nup B\n", "2. should have same board state");
        testbd.flip("2", 3);
        testbd.flip("2", 2);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nnone\nnone\nup B\nup B\n", "3. should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nnone\nnone\nmy B\nmy B\n", "4. should have same board state");
        testbd.flip("1", 2);
        assert.deepStrictEqual(await testbd.look("1"), "2x2\nnone\nnone\nup B\nup B\n", "5. should have same board state");
        assert.deepStrictEqual(await testbd.look("2"), "2x2\nnone\nnone\nmy B\nmy B\n", "6. should have same board state");
    });


});



/**
 * Example test case that uses async/await to test an asynchronous function.
 * Feel free to delete these example tests.
 */
describe('async test cases', function () {

    it('reads a file asynchronously', async function () {
        const fileContents = (await fs.promises.readFile('boards/ab.txt')).toString();
        assert(fileContents.startsWith('5x5'));
    });

    it('3 players chose the same card', async function () {
        const bd = await Board.parseFromFile("boards/test1.txt")
        await Promise.all([
            bd.flip("1", 0),
            bd.flip("2", 0),
            bd.flip("3", 0),
            bd.flip("1", 2),
        ]);
        assert.deepStrictEqual(await bd.look("1"), "2x2\nup A\ndown\nup B\ndown\n", "1. should have same board state");
        assert.deepStrictEqual(await bd.look("2"), "2x2\nmy A\ndown\nup B\ndown\n", "2. should have same board state");
        assert.deepStrictEqual(await bd.look("3"), "2x2\nup A\ndown\nup B\ndown\n", "3. should have same board state");
    });
});
