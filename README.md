# Memory_Scramble
The Memory Scramble game board has a grid of spaces. Each space starts with a card. As cards are matched and removed, spaces become empty.
A card in our game is a non-empty string of non-whitespace non-newline characters. This allows “pictures” like Hello and pictures like 🌈 by using emoji characters.

## Complete rules
First card: a player tries to turn over a first card by identifying a space on the board…

1-A
If there is no card there (the player identified an empty space, perhaps because the card was just removed by another player), the operation fails.
1-B
If the card is face down, it turns face up (all players can now see it) and the player controls that card.
1-C
If the card is already face up, but not controlled by another player, then it remains face up, and the player controls the card.
1-D
And if the card is face up and controlled by another player, the operation blocks. The player will contend with other players to take control of the card at the next opportunity.
Second card: once a player controls their first card, they can try to turn over a second card…

2-A
If there is no card there, the operation fails. The player also relinquishes control of their first card (but it remains face up for now).
2-B
If the card is face up and controlled by a player (another player or themselves), the operation fails. To avoid deadlocks, the operation does not block. The player also relinquishes control of their first card (but it remains face up for now).
—
If the card is face down, or if the card is face up but not controlled by a player, then:
2-C
If it is face down, it turns face up.
2-D
If the two cards are the same, that’s a successful match! The player keeps control of both cards (and they remain face up on the board for now).
2-E
If they are not the same, the player relinquishes control of both cards (again, they remain face up for now).
While one player is blocked turning over a first card, other players continue to play normally. They are not blocked, unless they also try to turn over a first card controlled by another player.

Failure in 1-A, 2-A, and 2-B only means that the player fails to control a card (and in 2-A/B, also relinquishes control). The player continues in the game.

After trying to turn over a second card, successfully or not, the player will try again to turn over a first card. When they do that, before following the rules above, they finish their previous play:

3-A
If they had turned over a matching pair, they control both cards. Now, those cards are removed from the board, and they relinquish control of them. Score-keeping is not specified as part of the game.
3-B
Otherwise, they had turned over one or two non-matching cards, and relinquished control but left them face up on the board. Now, for each of those card(s), if the card is still on the board, currently face up, and currently not controlled by another player, the card is turned face down.
If the player never tries to turn over a new first card, then the steps of 3-A/B never occur.
