import './App.css';
import { useEffect, useState } from 'react';
import * as SockJS from 'sockjs-client'
import * as Stomp from 'stompjs'
import axios from 'axios';

var stompClient = null;

function App() {

  const [playerId, setPlayerId] = useState(sessionStorage.getItem("playerId"));
  const [gameState, setGameState] = useState(JSON.parse(sessionStorage.getItem("game")));
  const [word, setWord] = useState('');

  useEffect(() => {
    if(playerId === null) {
      axios.get('http://localhost:8080/get/id').then((response) => {
        sessionStorage.setItem('playerId', response.data.id);
        setPlayerId(response.data.id);
      })
    }
    else if(gameState !== null) {
      connect();
    }
  }, []);

  const connect = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = Stomp.over(socket);
    stompClient.connect({login: JSON.parse(playerId)}, onConnected);
  };

  const onConnected = () => {
    stompClient.subscribe(
      "/user/" + playerId + "/queue/game-moves",
      onMessageReceived
    );
  };

  const onMessageReceived = (msg) => {
    const message = JSON.parse(msg.body);
    sessionStorage.setItem("game", JSON.stringify(message));
    setGameState(message);
  };


  const sendWord = () => {
    const message = {
      gameId: gameState.gameId,
      suggestedWord: word
    };
    stompClient.send("/game/move", {}, JSON.stringify(message));
  };

  return (
    <div className="App">

      {
        gameState === null && 
        <button onClick={connect}>Подключиться к игре</button>
      }

      {
        gameState !== null && gameState.gameId === "-" &&
        <div className='loaderContainer'>
          <div>Ожидание соперника</div>
          <div class="loader"></div>
        </div>
      }

      {
        gameState !== null && gameState.gameId !== "-" &&

        <div>

          {
            gameState.info !== '' &&
            <div style={{color: 'red'}}>{gameState.info}</div>
          }

          {
            gameState.movingPlayerId == playerId && 
            <div>
              {
                gameState.lastWord != '' &&
                <div>Предыдущий введенный город: {gameState.lastWord}</div>
              }
              <input type='text' name='word' onChange={(event) => setWord(event.target.value)}></input>
              <button onClick={sendWord}>ОК</button>
            </div>
          }

          {
            gameState.movingPlayerId != playerId && 
            <div style={{fontSize: '30px'}}>Ход соперника</div>
          }

        </div>
      }

    </div>
  );
}

export default App;