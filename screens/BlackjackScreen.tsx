// screens/BlackjackScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card as CardType } from '../types/Card';
import Hand from '../components/Hand';
import { generateDeck } from '../utils/generateDeck';

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

  const handValue = (hand: CardType[]): number => {
    let total = 0;
    let aces = 0;

    hand.forEach(card => {
      if (card.value === 'As') {
        aces += 1;
        total += 11;
      } else if (['Valet', 'Dame', 'Roi'].includes(card.value) || card.value === '10') {
        total += 10;
      } else {
        total += Number(card.value);
      }
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  };

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
    setPlayerHand(prev => [...prev, card]);
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

      while (handValue(dHand) < 17) {
        const [card, rest] = drawCard(dDeck);
        dHand.push(card);
        dDeck = rest;
      }
      setDealerHand(dHand);
      setDeck(dDeck);
      resolveWinner(dHand);
    };

    dealerPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerTurn]);

  const resolveWinner = (finalDealerHand: CardType[]) => {
    const playerScore = handValue(playerHand);
    const dealerScore = handValue(finalDealerHand);

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
        { !gameStarted || !playerTurn ? handValue(dealerHand) : '' }
      </Text>

      {/* RÈGLES CENTER */}
      <Text style={styles.rules}>
        Blackjack pays 3 pour 2{'\n'}
        Le croupier reste sur 17 soft{'\n'}
        Assurance paye 2 pour 1
      </Text>

      {/* PLAYER */}
      <Hand cards={playerHand} />
      <Text style={styles.scoreText}>{handValue(playerHand)}</Text>

      {/* BET & CONTROLS */}
      <Text style={styles.betText}>Mise : {bet} €</Text>

      {gameStarted ? (
        <>
          <View style={styles.buttonsRow}>
            <ActionButton label="Hit" color="#D7263D" onPress={hit} />
            <ActionButton label="Stay" color="#1FA774" onPress={stand} />
            <ActionButton label="Double" color="#46B3E6" onPress={doubleDown} />
            <ActionButton label="Split" color="#F2C94C" disabled />
          </View>
          <Text style={styles.info}>{message}</Text>
        </>
      ) : (
        <>
          <View style={styles.chipsRow}>
            <Chip value={10} bet={bet} setBet={setBet} credits={credits} />
            <Chip value={50} bet={bet} setBet={setBet} credits={credits} />
            <Chip value={100} bet={bet} setBet={setBet} credits={credits} />
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

const Chip = ({ value, bet, setBet, credits }: any) => {
  const disabled = credits < value;
  return (
    <TouchableOpacity
      onPress={() => !disabled && setBet(bet + value)}
      style={{ opacity: disabled ? 0.3 : 1 }}
    >
      <Image source={require('../assets/jetons/blue.png')} style={styles.chipImg} />
      <Text style={styles.chipLabel}>+{value}</Text>
    </TouchableOpacity>
  );
};

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

  chipsRow: { flexDirection: 'row', marginVertical: 15 },
  chipImg: { width: 40, height: 40 },
  chipLabel: { color: 'white', textAlign: 'center', fontSize: 12, marginTop: -8 },

  startBtn: { backgroundColor: '#DDD', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  startBtnText: { color: '#111', fontWeight: '600' },

  info: { color: '#FFD700', marginTop: 10 },

  creditsBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#865C2D', padding: 10 },
  creditsText: { color: 'white', textAlign: 'center', fontWeight: '700' },
});
