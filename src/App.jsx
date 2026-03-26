import { useState, useEffect } from "react";
import "./App.css";



function App() {
  const [targetWord, setTargetWord] = useState("");
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
      try {
        const response = await fetch("https://random-word-api.herokuapp.com/word?length=5");
        const data = await response.json();
        setTargetWord(data[0].toUpperCase());
      }
      catch (error) {
        console.log("errore fetching random word, using fallback list:", error);
      }
    }
    fetchRandomWord();
  }, []);

  const getTileColor = (letter, index, guess) => {
    if (!letter) return "empty";
    if (targetWord[index] === letter) return "correct";
    if (targetWord.includes(letter)) return "wrong-spot";
    return "wrong";
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
    if (currentGuess.length !== 5) return;
    if (gameOver || won) return;

    const newGuesses = [...guesses];
    const currentRowIndex = newGuesses.findIndex((g) => g === "");
    newGuesses[currentRowIndex] = currentGuess;

    const newTileStates = [...tileStates];
    newTileStates[currentRowIndex] = currentGuess
      .split("")
      .map((letter, idx) => getTileColor(letter, idx, currentGuess));
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
    try {
      const response = await fetch("https://random-word-api.herokuapp.com/word?length=5");
      const data = await response.json();
      setTargetWord(data[0].toUpperCase());
    }
    catch (error){
      console.error("Error fetching random word:", error);
    }
    
    
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
              disabled={gameOver && !won}
              className="word-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={currentGuess.length !== 5}
              className="submit-btn"
            >
              Submit
            </button>
          </form>
        )}
      </footer>
    </div>
  );
}

export default App;
