import { useState, useEffect } from "react";
import "./App.css";

const FALLBACK_WORDS = [
  "APPLE",
  "BRAIN",
  "CRANE",
  "PLANT",
  "SHEEP",
  "SMILE",
  "STONE",
  "TRAIN",
  "WATER",
  "LIGHT",
];

const getRandomFiveLetterWord = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(
      "https://random-word-api.herokuapp.com/word?length=5",
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const apiWord = Array.isArray(data) ? data[0] : "";

    if (typeof apiWord === "string" && apiWord.length === 5) {
      return apiWord.toUpperCase();
    }
  } catch (error) {
    console.log("Error fetching random word, using fallback list:", error);
  } finally {
    clearTimeout(timeoutId);
  }

  return FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
};

function App() {
  const [targetWord, setTargetWord] = useState("");
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const [guesses, setGuesses] = useState(Array(6).fill(""));
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [tileStates, setTileStates] = useState(
    Array(6)
      .fill(null)
      .map(() => Array(5).fill("empty")),
  );

  useEffect(() => {
    const fetchRandomWord = async () => {
      setIsLoadingWord(true);
      const word = await getRandomFiveLetterWord();
      console.log("Target word:", word);
      setTargetWord(word);
      setIsLoadingWord(false);
    };

    fetchRandomWord();
  }, []);

  const getTileStates = (guess) => {
    const states = Array(5).fill("wrong");
    const remainingLetters = {};

    for (let index = 0; index < 5; index += 1) {
      const targetLetter = targetWord[index];
      const guessedLetter = guess[index];

      if (guessedLetter === targetLetter) {
        states[index] = "correct";
      } else {
        remainingLetters[targetLetter] =
          (remainingLetters[targetLetter] || 0) + 1;
      }
    }

    for (let index = 0; index < 5; index += 1) {
      if (states[index] === "correct") continue;

      const guessedLetter = guess[index];
      if (!guessedLetter) {
        states[index] = "empty";
        continue;
      }

      if (remainingLetters[guessedLetter] > 0) {
        states[index] = "wrong-spot";
        remainingLetters[guessedLetter] -= 1;
      }
    }

    return states;
  };

  const handleInputChange = (e) => {
    const input = e.target.value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 5);
    setCurrentGuess(input);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentGuess.length !== 5 || !targetWord || isLoadingWord) return;
    if (gameOver || won) return;

    const newGuesses = [...guesses];
    const currentRowIndex = newGuesses.findIndex((g) => g === "");
    newGuesses[currentRowIndex] = currentGuess;

    const newTileStates = [...tileStates];
    newTileStates[currentRowIndex] = getTileStates(currentGuess);
    setTileStates(newTileStates);

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
    } else if (currentRowIndex === 5) {
      setGameOver(true);
    }

    setGuesses(newGuesses);
    setCurrentGuess("");
  };

  const handleRestart = async () => {
    setIsLoadingWord(true);
    const word = await getRandomFiveLetterWord();
    setTargetWord(word);
    setIsLoadingWord(false);

    setGuesses(Array(6).fill(""));
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setTileStates(
      Array(6)
        .fill(null)
        .map(() => Array(5).fill("empty")),
    );
  };

  const currentRowIndex = guesses.findIndex((g) => g === "");

  return (
    <div className="wordle-container">
      <header className="wordle-header">
        <h1>WORDLE</h1>
        {isLoadingWord && <div className="game-message">Loading word...</div>}
        {gameOver && (
          <div className="game-message">
            {won
              ? `🎉 You Won! Word: ${targetWord}`
              : `Game Over! Word: ${targetWord}`}
          </div>
        )}
      </header>

      <main className="wordle-game">
        <div className="game-board">
          {[...Array(6)].map((_, rowIdx) => (
            <div key={rowIdx} className="wordle-row">
              {[...Array(5)].map((_, colIdx) => {
                const letter =
                  rowIdx === currentRowIndex
                    ? currentGuess[colIdx]
                    : guesses[rowIdx]?.[colIdx];
                const state =
                  rowIdx === currentRowIndex
                    ? letter
                      ? "filled"
                      : "empty"
                    : tileStates[rowIdx]?.[colIdx] || "empty";

                return (
                  <div key={colIdx} className={`wordle-tile ${state}`}>
                    <span>{letter || ""}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      <footer className="wordle-input-section">
        {gameOver ? (
          <button className="submit-btn" onClick={handleRestart}>
            Play Again
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              maxLength="5"
              placeholder="Enter a 5-letter word"
              value={currentGuess}
              onChange={handleInputChange}
              disabled={(gameOver && !won) || isLoadingWord || !targetWord}
              className="word-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={
                currentGuess.length !== 5 || isLoadingWord || !targetWord
              }
              className="submit-btn"
            >
              {isLoadingWord ? "Loading..." : "Submit"}
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}

export default App;
