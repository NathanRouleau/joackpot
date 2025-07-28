import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card as CardType } from '../types/Card';
import Hand from '../components/Hand';
import { generateDeck } from '../utils/generateDeck';
import { points } from '../utils/valueMap';
import { getHandTotals } from '../utils/handTotals';
import Chip from '../components/Chip';

const INITIAL_CREDITS = 1000;

export default function BlackjackScreen() {
  /* ---------- STATE ---------- */
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [bet, setBet] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerTurn, setPlayerTurn] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Commencer la partie');

  /* ---------- HELPERS ---------- */
  const drawCard = (currentDeck: CardType[]): [CardType, CardType[]] => {
    const newDeck = [...currentDeck];
    const card = newDeck.shift() as CardType;
    return [card, newDeck];
  };

  const bestValue = (hand: CardType[]) => {
    const totals = getHandTotals(hand);
    return totals[totals.length - 1];
  };

  const formatTotals = (hand: CardType[]) => {
    const totals = getHandTotals(hand);
    return totals.length > 1
      ? `${totals[0]} / ${totals[1]}`
      : `${totals[0]}`;
  }

  /* ---------- GAME FLOW ---------- */
  const initGame = () => {
    if (bet === 0) {
      setMessage('Place une mise avant !');
      return;
    }
    let newDeck = generateDeck();        // 6 decks par défaut
    const [p1, d1, p2, d2] = [0, 0, 0, 0].map(() => {
      const [card, rest] = drawCard(newDeck);
      newDeck = rest;
      return card;
    });

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setDeck(newDeck);
    setGameStarted(true);
    setPlayerTurn(true);
    setMessage('');
  };

  const hit = () => {
    if (!playerTurn) return;
    const [card, newDeck] = drawCard(deck);
    setPlayerHand(prevHand => {
      const updatedHand = [...prevHand, card];
      const total = bestValue(updatedHand);
      if (total >= 21) {
        setPlayerTurn(false);
      }
      return updatedHand;
    });

    setDeck(newDeck);
  };

  const stand = () => {
    setPlayerTurn(false);
  };

  const doubleDown = () => {
    if (!playerTurn || credits < bet) return;
    setCredits(c => c - bet);
    setBet(b => b * 2);
    hit();
    setPlayerTurn(false);
  };

  /* ---------- DEALER LOGIC ---------- */
  useEffect(() => {
    if (!gameStarted || playerTurn) return;

    const dealerPlay = () => {
      let dHand = [...dealerHand];
      let dDeck = [...deck];

      while (bestValue(dHand) < 17) {
        const [card, rest] = drawCard(dDeck);
        dHand.push(card);
        dDeck = rest;
      }
      setDealerHand(dHand);
      setDeck(dDeck);
      resolveWinner(dHand);
    };

    dealerPlay();
  }, [playerTurn]);

  const resolveWinner = (finalDealerHand: CardType[]) => {
    const playerScore = bestValue(playerHand);
    const dealerScore = bestValue(finalDealerHand);

    let resultMsg = '';
    if (playerScore > 21) {
      resultMsg = 'Bust ! Le croupier gagne.';
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      resultMsg = 'Tu gagnes !';
      setCredits(c => c + bet * 2);
    } else if (playerScore === dealerScore) {
      resultMsg = 'Égalité.';
      setCredits(c => c + bet);
    } else {
      resultMsg = 'Le croupier gagne.';
    }

    setMessage(resultMsg);
    setGameStarted(false);
    setBet(0);
  };

  const addBet = (amount: number) => {
    if(!gameStarted && credits >= amount) {
      setBet(b => b + amount);
      setCredits(c => c - amount);
    }
  }

  /* ---------- RENDER ---------- */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.menuText}>Menu</Text>
        <Image source={require('../assets/cartes/back.png')} style={styles.deckIcon} />
      </View>

      {/* DEALER */}
      <Hand cards={dealerHand} hideFirst={gameStarted && playerTurn} />
      <Text style={styles.scoreText}>
        { !gameStarted || !playerTurn ? formatTotals(dealerHand) : '' }
      </Text>

      {/* RÈGLES CENTER */}
      <Text style={styles.rules}>
        Blackjack paie 3 pour 2{'\n'}
        Le croupier tire à 16 et reste à 17{'\n'}
        Assurance paie 2 pour 1
      </Text>

      {/* PLAYER */}
      <Hand cards={playerHand} />
      <Text style={styles.scoreText}>{formatTotals(playerHand)}</Text>

      {/* BET & CONTROLS */}
      <Text style={styles.betText}>Mise : {bet} €</Text>

      {gameStarted ? (
        <>
          <View style={styles.buttonsRow}>
            <ActionButton label="Hit" color="#D7263D" onPress={hit} disabled={!playerTurn}/>
            <ActionButton label="Stay" color="#1FA774" onPress={stand} />
            <ActionButton label="Double" color="#46B3E6" onPress={doubleDown} />
            <ActionButton label="Split" color="#F2C94C" disabled />
          </View>
          <Text style={styles.info}>{message}</Text>
        </>
      ) : (
        <>
          <View style={styles.chipsRow}>
            {[1, 5, 10, 50, 100, 500].map(v => (
              <Chip key={v} value={v} credits={credits} addBet={addBet} />
            ))}
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={initGame}>
            <Text style={styles.startBtnText}>Commencer la partie</Text>
          </TouchableOpacity>
          <Text style={styles.info}>{message}</Text>
        </>
      )}

      {/* FOOTER (CREDITS) */}
      <View style={styles.creditsBar}>
        <Text style={styles.creditsText}>{credits} €</Text>
      </View>
    </View>
  );
}

/* ---------- PETITS COMPOS INTERNES ---------- */
const ActionButton = ({ label, color, onPress, disabled }: any) => (
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: color, opacity: disabled ? 0.4 : 1 }]}
    onPress={disabled ? undefined : onPress}
  >
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A0000', paddingTop: 30, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuText: { color: 'white', fontSize: 22, fontFamily: 'Cinzel' },
  deckIcon: { width: 60, height: 80, transform: [{ rotate: '20deg' }] },

  scoreText: { color: 'white', fontSize: 18, marginVertical: 5 },
  rules: { color: '#EEE', fontSize: 12, textAlign: 'center', marginVertical: 5 },

  betText: { color: '#EEE', marginVertical: 10 },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginHorizontal: 3 },
  actionBtnText: { color: '#111', fontWeight: '700' },

  chipsRow: { flexDirection: 'row', marginVertical: 15, justifyContent: 'center' },

  startBtn: { backgroundColor: '#DDD', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  startBtnText: { color: '#111', fontWeight: '600' },

  info: { color: '#FFD700', marginTop: 10 },

  creditsBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#865C2D', padding: 20 },
  creditsText: { color: 'white', textAlign: 'center', fontSize: 32, fontWeight: '700' },
});
