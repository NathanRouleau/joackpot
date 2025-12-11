import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ImageBackground, Animated, Easing, Alert } from 'react-native';
import { Card as CardType } from '../types/Card';
import Hand from '../components/Hand';
import { generateDeck } from '../utils/generateDeck';
import { getHandTotals } from '../utils/handTotals';
import Chip from '../components/Chip';
import { useNavigation } from '@react-navigation/native';
import RulesModal from '../components/RulesModal';
import Feather from '@expo/vector-icons/Feather';
import GameResultPopup from '../components/GameResultPopup';
import TurnTimerRing from "../components/TurnTimerRing";
import { useTurnTimer } from "../hooks/useTurnTimer";

const INITIAL_CREDITS = 1000;

/* ---------- TYPES & HELPERS POUR LES SIDE BETS ---------- */

// Mapping des valeurs textuelles vers numériques pour le poker
const getCardPokerValue = (value: string): number => {
  switch (value) {
    case 'Deux': return 2;
    case 'Trois': return 3;
    case 'Quatre': return 4;
    case 'Cinq': return 5;
    case 'Six': return 6;
    case 'Sept': return 7;
    case 'Huit': return 8;
    case 'Neuf': return 9;
    case 'Dix': return 10;
    case 'Valet': return 11;
    case 'Dame': return 12;
    case 'Roi': return 13;
    case 'As': return 14; // As fort pour les suites hautes
    default: return 0;
  }
};

// --- LOGIQUE 21+3 ---
const checkThreeCardPokerHand = (h1: CardType, h2: CardType, d1: CardType): { type: string, multiplier: number } => {
  const cards = [h1, h2, d1];
  const suits = cards.map(c => c.suit);
  const values = cards.map(c => getCardPokerValue(c.value)).sort((a, b) => a - b);
  
  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
  const isTrips = values[0] === values[1] && values[1] === values[2];
  
  // Check Straight (Suite)
  // Cas spécial: As-2-3 (14, 2, 3) -> on le traite comme 1, 2, 3 pour la suite
  let isStraight = (values[0] + 1 === values[1] && values[1] + 1 === values[2]);
  if (!isStraight && values[2] === 14 && values[0] === 2 && values[1] === 3) {
    isStraight = true; // A-2-3
  }

  if (isFlush && isTrips) return { type: "Brelan Parfait (Suited Trips)", multiplier: 100 };
  if (isFlush && isStraight) return { type: "Quinte Flush", multiplier: 40 };
  if (isTrips) return { type: "Brelan", multiplier: 30 };
  if (isStraight) return { type: "Quinte", multiplier: 10 };
  if (isFlush) return { type: "Couleur", multiplier: 5 };

  return { type: "", multiplier: 0 };
};

// --- LOGIQUE BONUS DAME ---
const checkPlayerPairBonus = (h1: CardType, h2: CardType): { type: string, multiplier: number } => {
  const v1 = getCardPokerValue(h1.value);
  const v2 = getCardPokerValue(h2.value);
  
  // Check Double Dame de Cœur (Jackpot)
  if (v1 === 12 && v2 === 12 && h1.suit === 'Coeur' && h2.suit === 'Coeur') {
    return { type: "Double Dame de Cœur 👑", multiplier: 100 };
  }

  const isPair = v1 === v2;
  const isSuited = h1.suit === h2.suit;

  // Couleurs (Rouge: Coeur/Carreau, Noir: Pique/Trefle)
  const isRed1 = ['Coeur', 'Carreau'].includes(h1.suit);
  const isRed2 = ['Coeur', 'Carreau'].includes(h2.suit);
  const isSameColor = (isRed1 && isRed2) || (!isRed1 && !isRed2);

  if (isPair) {
    if (isSuited) return { type: "Paire Parfaite", multiplier: 50 }; // Suited Pair
    if (isSameColor) return { type: "Paire Couleur", multiplier: 15 }; // Colored Pair
    return { type: "Paire Mixte", multiplier: 7 }; // Mixed Pair
  }

  // Check Total 20 (non paire) : ex Roi + Valet, 10 + Dame, etc.
  // Attention: pour le blackjack, Valet/Dame/Roi valent 10.
  const bjValue1 = v1 > 10 && v1 < 14 ? 10 : (v1 === 14 ? 11 : v1); // On compte l'As comme 11 pour le 20
  const bjValue2 = v2 > 10 && v2 < 14 ? 10 : (v2 === 14 ? 11 : v2);
  
  if (bjValue1 + bjValue2 === 20) {
    return { type: "Total 20", multiplier: 3 };
  }

  return { type: "", multiplier: 0 };
};


export default function BlackjackScreen() {
  /* ---------- STATE ---------- */
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHands, setPlayerHands] = useState<CardType[][]>([[]]);
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  
  // Mises : bets[0] = Main Bet. 
  const [bets, setBets] = useState<number[]>([0]);
  // Side Bets state
  const [sideBets, setSideBets] = useState<{ poker: number, ladies: number }>({ poker: 0, ladies: 0 });
  const [sideBetResults, setSideBetResults] = useState<string[]>([]); // Pour afficher les gains au début

  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerTurn, setPlayerTurn] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Place tes mises');
  
  const [insuranceOffered, setInsuranceOffered] = useState<boolean>(false);
  const [insuranceBet, setInsuranceBet] = useState<number>(0);
  
  const [playerFlipped, setPlayerFlipped] = useState<boolean[][]>([[true, true]]);
  const [dealerFlipped, setDealerFlipped] = useState<boolean[]>([false]);
  
  const [showRules, setShowRules] = useState<boolean>(false);
  const [lastActionAt, setLastActionAt] = useState<number>(Date.now());

  // Animation victoire/défaite
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupColor, setPopupColor] = useState('#fff');

  // Animation crédits 
  const creditAnim = useRef(new Animated.Value(credits)).current;
  const [displayCredits, setDisplayCredits] = useState(credits); 
  const [gainToShow, setGainToShow] = useState(0);

  /* ---------- ANIMATIONS UTILS ---------- */
  const glow = useRef(new Animated.Value(0.6)).current;
  const gainOpacity = useRef(new Animated.Value(0)).current;
  const gainTranslate = useRef(new Animated.Value(0)).current;
  const gainScale = useRef(new Animated.Value(0.8)).current;
  const barPulse = useRef(new Animated.Value(0)).current;
  const isCreditAnimating = useRef(false);

  /* ---------- HELPERS ---------- */
  const navigation = useNavigation();
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
    return totals.length > 1 ? `${totals[0]} / ${totals[1]}` : `${totals[0]}`;
  }
  
  const canSplit = gameStarted && playerTurn && playerHands[currentHandIndex].length === 2 && playerHands[currentHandIndex][0].value === playerHands[currentHandIndex][1].value;
  const isBlackjack = (hand: CardType[]) => hand.length === 2 && bestValue(hand) === 21;
  const dealerShowsAce = (dealerUp: CardType) => dealerUp.value === 'As';
  const handScale = (len: number) => (len === 1 ? 1 : len === 2 ? 0.9 : 0.8);
  const markAction = () => setLastActionAt(Date.now());

  /* ---------- CREDIT ANIMATION ---------- */
  useEffect(() => {
    const id = creditAnim.addListener(({ value }) => {
      setDisplayCredits(Math.round(value));
    });
    return () => { creditAnim.removeListener(id); };
  }, []);

  useEffect(() => {
    if (isCreditAnimating.current) return;
    creditAnim.setValue(credits);
  }, [credits]);

  const animateCreditChange = (delta: number, toValue: number) => {
    if (delta === 0) return;
    isCreditAnimating.current = true;
    setGainToShow(delta);
    gainOpacity.setValue(0);
    gainTranslate.setValue(12);
    gainScale.setValue(0.8);
    barPulse.setValue(0);

    Animated.parallel([
      Animated.timing(creditAnim, { toValue, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(gainOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(gainScale, { toValue: 1.08, friction: 4, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(gainTranslate, { toValue: -14, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(gainOpacity, { toValue: 0, duration: 350, delay: 400, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.timing(barPulse, { toValue: 1, duration: 160, useNativeDriver: false }),
        Animated.timing(barPulse, { toValue: 0, duration: 260, useNativeDriver: false }),
      ]),
    ]).start(() => {
      isCreditAnimating.current = false;
      setGainToShow(0);
    });
  };

  /* ---------- TIMER LOGIC ---------- */
  const currentHand = playerHands[currentHandIndex] ?? [];
  const isPlayerActive = gameStarted && playerTurn && currentHand.length > 0 && !isBlackjack(currentHand) && bestValue(currentHand) < 21;
  const paused = showRules || insuranceOffered;

  const handleExpire = () => { if (playerTurn) stand(); };
  const { mmss, progress } = useTurnTimer({
    isActive: isPlayerActive,
    durationMs: 15000,
    paused,
    onExpire: handleExpire,
    resetKey: [currentHandIndex, lastActionAt],
  });

  useEffect(() => {
    if (gameStarted && playerTurn) markAction();
  }, [gameStarted, playerTurn, currentHandIndex]);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (playerHands.length > 1) {
      loop = Animated.loop(Animated.sequence([
          Animated.timing(glow, { toValue: 0.65, duration: 1200, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0.35, duration: 1200, useNativeDriver: false }),
      ]));
      loop.start();
    } else {
      glow.setValue(0.25);
    }
    return () => loop?.stop?.();
  }, [playerHands.length]);

  /* ---------- BETTING LOGIC ---------- */
  // On stocke le type de mise activement sélectionné pour ajouter des jetons
  const [selectedBetTarget, setSelectedBetTarget] = useState<'main' | 'poker' | 'ladies'>('main');

  const addBet = (amount: number) => {
    if (gameStarted) return;
    if (credits < amount) return;

    if (selectedBetTarget === 'main') {
      setBets([bets[0] + amount]);
      setCredits(c => c - amount);
    } else if (selectedBetTarget === 'poker') {
      setSideBets(prev => ({ ...prev, poker: prev.poker + amount }));
      setCredits(c => c - amount);
    } else if (selectedBetTarget === 'ladies') {
      setSideBets(prev => ({ ...prev, ladies: prev.ladies + amount }));
      setCredits(c => c - amount);
    }
  };

  const clearBets = () => {
    if (gameStarted) return;
    const totalRefund = bets[0] + sideBets.poker + sideBets.ladies;
    setCredits(c => c + totalRefund);
    setBets([0]);
    setSideBets({ poker: 0, ladies: 0 });
    setSelectedBetTarget('main');
  };

  /* ---------- GAME FLOW ---------- */
  const initGame = async () => {
    if (bets[0] === 0) {
      setMessage('Place une mise principale !');
      return;
    }

    setSideBetResults([]); // Reset visual feedback

    let newDeck = generateDeck(); // 6 decks
    // Draw 3 initial cards
    const [p1, deck1] = drawCard(newDeck);
    const [d1, deck2] = drawCard(deck1);
    const [p2, deck3] = drawCard(deck2);

    const initialPlayerHand = [p1, p2];
    const initialDealerHand = [d1];

    setPlayerHands([initialPlayerHand]);
    setCurrentHandIndex(0);
    setDealerHand(initialDealerHand);
    setDeck(deck3);

    // Flips
    setPlayerFlipped([[false, false]]);
    setDealerFlipped([false]);

    // Animation séquentielle
    setTimeout(() => setPlayerFlipped([[true, false]]), 500);
    setTimeout(() => setDealerFlipped([true]), 1000);
    
    // Au moment où la 2e carte joueur est révélée, on check les bonus
    setTimeout(() => {
      setPlayerFlipped([[true, true]]);
      
      // --- CHECK SIDE BETS ---
      let bonusWinnings = 0;
      let resultsText = [];

      // 1. Check 21+3
      if (sideBets.poker > 0) {
        const pokerRes = checkThreeCardPokerHand(p1, p2, d1);
        if (pokerRes.multiplier > 0) {
          const win = sideBets.poker * (pokerRes.multiplier + 1); // +1 car on rend la mise
          bonusWinnings += win;
          resultsText.push(`21+3: ${pokerRes.type} (+${win}€)`);
        } else {
          resultsText.push(`21+3: Perdu`);
        }
      }

      // 2. Check Bonus Dame
      if (sideBets.ladies > 0) {
        const ladiesRes = checkPlayerPairBonus(p1, p2);
        if (ladiesRes.multiplier > 0) {
          const win = sideBets.ladies * (ladiesRes.multiplier + 1);
          bonusWinnings += win;
          resultsText.push(`Dame: ${ladiesRes.type} (+${win}€)`);
        } else {
          resultsText.push(`Dame: Perdu`);
        }
      }

      // Paiement immédiat des bonus
      if (bonusWinnings > 0) {
        animateCreditChange(bonusWinnings, credits + bonusWinnings);
        setCredits(c => c + bonusWinnings);
        // Reset des mises bonus car traitées
        setSideBets({ poker: 0, ladies: 0 }); 
      }
      
      if (resultsText.length > 0) {
        // Affichage temporaire des résultats bonus
        setSideBetResults(resultsText);
        setTimeout(() => setSideBetResults([]), 4000);
      }

    }, 1500);

    // Suite logique du jeu
    setTimeout(() => {
      const playerBJ = isBlackjack([p1, p2]);
      const dealerUpIsAce = dealerShowsAce(d1);

      if (playerBJ && !dealerUpIsAce) {
        setCredits(c => c + bets[0] * 2.5);
        setBets([0]);
        setGameStarted(false);
        setPlayerTurn(false);
        setMessage('Blackjack ! Paiement 3:2');
        setPopupMessage('BLACKJACK 🎉');
        setPopupColor('#4CAF50');
        setPopupVisible(true);
      } else {
        setGameStarted(true);
        setPlayerTurn(!playerBJ);
        setMessage('');
        markAction();
        if (dealerUpIsAce) {
          setTimeout(() => setInsuranceOffered(true), 1000);
        }
      }
    }, 2000);
  };

  const hit = () => {
    if (!playerTurn) return;
    const [card, newDeck] = drawCard(deck);

    setPlayerHands(prevHands => {
      const updatedHands = [...prevHands];
      const updatedCurrentHand = [...updatedHands[currentHandIndex], card];
      updatedHands[currentHandIndex] = updatedCurrentHand;

      // Anim
      setPlayerFlipped(prev => {
        const next = [...prev];
        next[currentHandIndex] = [...(next[currentHandIndex] || []), false];
        return next;
      });
      setTimeout(() => {
        setPlayerFlipped(prev => {
          const next = [...prev];
          next[currentHandIndex][updatedCurrentHand.length - 1] = true;
          return next;
        });

        const total = bestValue(updatedCurrentHand);
        if (total > 21) {
          if (currentHandIndex < updatedHands.length - 1) {
            setCurrentHandIndex(i => i + 1);
          } else {
            setTimeout(() => setPlayerTurn(false), 1000);
          }
        }
      }, 500);

      return updatedHands;
    });

    setDeck(newDeck);
    markAction();
  };

  const stand = () => {
    if (currentHandIndex < playerHands.length - 1) {
      setCurrentHandIndex(i => i + 1);
    } else {
      setPlayerTurn(false);
    }
    markAction();
  };

  const doubleDown = () => {
    if (!playerTurn || credits < bets[currentHandIndex] || playerHands.length > 1) return;
    setCredits(c => c - bets[currentHandIndex]);
    setBets(arr => {
      const newArr = [...arr];
      newArr[currentHandIndex] *= 2;
      return newArr;
    });
    hit();
    setTimeout(() => setPlayerTurn(false), 1000);
    markAction();
  };

  const splitHand = () => {
    const oldBets = [...bets];
    const newBet = oldBets[currentHandIndex];
    if (credits < newBet) { setMessage('Crédits insuffisants'); return; }

    const hands = [...playerHands];
    const handToSplit = hands[currentHandIndex];
    
    // Split logic
    const newHand1 = [handToSplit[0]];
    const newHand2 = [handToSplit[1]];
    
    const newHands = [...hands.slice(0, currentHandIndex), newHand1, newHand2, ...hands.slice(currentHandIndex + 1)];
    const newBets = [...oldBets.slice(0, currentHandIndex), newBet, newBet, ...oldBets.slice(currentHandIndex + 1)];
    
    // Flips logic update
    const oldFlips = playerFlipped[currentHandIndex];
    const newFlipped = [...playerFlipped.slice(0, currentHandIndex), [oldFlips[0], false], [oldFlips[1], false], ...playerFlipped.slice(currentHandIndex + 1)];

    setPlayerHands(newHands);
    setBets(newBets);
    setCredits(c => c - newBet);
    setPlayerFlipped(newFlipped);
    
    // Deal 2 new cards for split hands logic not fully implemented here for brevity, usually we just hit immediately or wait for next action
    // But standard is: separate them, and let user play hand 1.
    // NOTE: In this simplified version, we just split. The user will have to HIT to get 2nd card on each hand.
    
    markAction();
  };

  /* ---------- DEALER ---------- */
  useEffect(() => {
    if (!gameStarted || playerTurn) return;

    const dealerPlay = async () => {
      let dHand = [...dealerHand];
      let dDeck = [...deck];
      let dFlipped = [...dealerFlipped];

      // Reveal hidden card if exists (usually dealing starts with 1 up, here we simulate 2nd card draw for dealer)
      if (dHand.length === 1) {
        const [second, rest] = drawCard(dDeck);
        dHand.push(second);
        dDeck = rest;
        dFlipped.push(false);
        setDealerHand([...dHand]);
        setDealerFlipped([...dFlipped]);
        await new Promise(r => setTimeout(r, 500));
        dFlipped[dFlipped.length - 1] = true;
        setDealerFlipped([...dFlipped]);
        await new Promise(r => setTimeout(r, 500));
      }

      while (bestValue(dHand) < 17) {
        const [card, rest] = drawCard(dDeck);
        dHand.push(card);
        dDeck = rest;
        dFlipped.push(false);
        setDealerHand([...dHand]);
        setDealerFlipped([...dFlipped]);
        await new Promise(r => setTimeout(r, 500));
        dFlipped[dFlipped.length - 1] = true;
        setDealerFlipped([...dFlipped]);
        await new Promise(r => setTimeout(r, 500));
      }

      setDealerHand(dHand);
      setDeck(dDeck);
      resolveWinner(dHand);
    };
    dealerPlay();
  }, [playerTurn]);

  const resolveWinner = (finalDealerHand: CardType[]) => {
    const dealerScore = bestValue(finalDealerHand);
    let gain = 0;
    let mainPopupMsg = '';
    let mainPopupColor = '#fff';

    playerHands.forEach((hand, idx) => {
      const playerScore = bestValue(hand);
      const playerBJ = isBlackjack(hand);
      const dealerBJ = isBlackjack(finalDealerHand);

      if (playerBJ && dealerBJ) {
        gain += bets[idx]; // Push
        mainPopupMsg = 'ÉGALITÉ'; mainPopupColor = '#FFD700';
      } else if (playerBJ) {
        gain += bets[idx] * 2.5;
        mainPopupMsg = 'BLACKJACK 🎉'; mainPopupColor = '#4CAF50';
      } else if (dealerBJ) {
        mainPopupMsg = 'DÉFAITE ❌'; mainPopupColor = '#D7263D';
      } else if (playerScore > 21) {
        mainPopupMsg = 'BUST ❌'; mainPopupColor = '#D7263D';
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        gain += bets[idx] * 2;
        mainPopupMsg = 'VICTOIRE 🎉'; mainPopupColor = '#4CAF50';
      } else if (playerScore === dealerScore) {
        gain += bets[idx]; // Push
        mainPopupMsg = 'ÉGALITÉ'; mainPopupColor = '#FFD700';
      } else {
        mainPopupMsg = 'DÉFAITE ❌'; mainPopupColor = '#D7263D';
      }
    });

    if (insuranceBet > 0) {
      if (isBlackjack(finalDealerHand)) gain += insuranceBet * 3;
      setInsuranceBet(0);
    }

    animateCreditChange(gain, credits + gain);
    setCredits(c => c + gain);
    setGameStarted(false);
    setBets([0]);
    
    setPopupMessage(mainPopupMsg);
    setPopupColor(mainPopupColor);
    setPopupVisible(true);
  };

  const takeInsurance = () => {
    const maxIns = bets[0] / 2;
    if (credits >= maxIns) { setCredits(c => c - maxIns); setInsuranceBet(maxIns); }
    setInsuranceOffered(false);
  };
  const declineInsurance = () => setInsuranceOffered(false);


  return (
    <>
      <GameResultPopup visible={popupVisible} message={popupMessage} color={popupColor} onHide={() => setPopupVisible(false)} />
      
      {/* Rules Modal */}
      <RulesModal visible={showRules} onClose={() => setShowRules(false)} />

      {/* Insurance Modal */}
      <Modal visible={insuranceOffered} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assurance ?</Text>
            <Text style={styles.modalText}>Le croupier a un As. Assurer pour {bets[0]/2}€ ?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.yesBtn} onPress={takeInsurance}><Text style={styles.btnTxt}>Oui</Text></TouchableOpacity>
              <TouchableOpacity style={styles.noBtn} onPress={declineInsurance}><Text style={styles.btnTxt}>Non</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.menuText}>← Menu</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRules(true)}><Feather name="info" style={styles.infoBtn} size={24} /></TouchableOpacity>
        </View>

        <TurnTimerRing visible={isPlayerActive} mmss={mmss} progress={progress} style={{ position: "absolute", top: 40, alignSelf: "center" }} />

        {/* FEEDBACK DES BONUS */}
        {sideBetResults.length > 0 && (
          <View style={styles.bonusFeedback}>
            {sideBetResults.map((res, i) => (
              <Text key={i} style={styles.bonusText}>{res}</Text>
            ))}
          </View>
        )}

        <View style={styles.gameArea}>
          {/* DEALER AREA */}
          <Hand cards={dealerHand} flipped={dealerFlipped} />
          <Text style={styles.scoreText}>{!gameStarted || !playerTurn ? formatTotals(dealerHand) : ''}</Text>

          {/* PLAYER AREA */}
          <View style={styles.playerSection}>
            {playerHands.map((hand, idx) => {
              const isActive = playerHands.length > 1 && idx === currentHandIndex;
              return (
                <Animated.View key={idx} style={{ alignItems: 'center', marginHorizontal: 12 }}>
                  {isActive && (
                    <Animated.View style={[styles.glow, { opacity: glow }]} />
                  )}
                  <Hand cards={hand} flipped={playerFlipped[idx]} stacked={playerHands.length > 1} scale={handScale(playerHands.length)} />
                  <Text style={styles.scoreText}>{formatTotals(hand)}</Text>
                </Animated.View>
              );
            })}
          </View>

          {/* AFFICHAGE DES MISES (Main + Sides) */}
          <View style={styles.betsDisplay}>
             <View style={styles.betBox}>
                <Text style={styles.betLabel}>21+3</Text>
                <Text style={styles.betValue}>{sideBets.poker} €</Text>
             </View>
             <View style={[styles.betBox, styles.mainBetBox]}>
                <Text style={styles.betLabel}>MISE</Text>
                <Text style={[styles.betValue, { fontSize: 20 }]}>{bets.reduce((a,b)=>a+b, 0)} €</Text>
             </View>
             <View style={styles.betBox}>
                <Text style={styles.betLabel}>Dame</Text>
                <Text style={styles.betValue}>{sideBets.ladies} €</Text>
             </View>
          </View>


          {/* ACTIONS / CHIPS */}
          {gameStarted ? (
            <View style={styles.buttonsRow}>
              <ActionButton label="Tirer" color="#D7263D" onPress={hit} disabled={!playerTurn} />
              <ActionButton label="Rester" color="#1FA774" onPress={stand} disabled={!playerTurn} />
              <ActionButton label="Doubler" color="#46B3E6" onPress={doubleDown} disabled={!playerTurn || playerHands.length > 1} />
              {canSplit && <ActionButton label="Split" color="#F2C94C" onPress={splitHand} disabled={!canSplit || !playerTurn} />}
            </View>
          ) : (
            <>
              {/* ZONES DE MISE SÉLECTIONNABLES */}
              <View style={styles.betSelectionRow}>
                 <TouchableOpacity 
                    style={[styles.betTarget, selectedBetTarget === 'poker' && styles.betTargetActive]}
                    onPress={() => setSelectedBetTarget('poker')}
                 >
                    <Text style={styles.betTargetText}>21+3</Text>
                 </TouchableOpacity>
                 
                 <TouchableOpacity 
                    style={[styles.betTarget, selectedBetTarget === 'main' && styles.betTargetActive]}
                    onPress={() => setSelectedBetTarget('main')}
                 >
                    <Text style={styles.betTargetText}>Mise Principale</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                    style={[styles.betTarget, selectedBetTarget === 'ladies' && styles.betTargetActive]}
                    onPress={() => setSelectedBetTarget('ladies')}
                 >
                    <Text style={styles.betTargetText}>Bonus Dame</Text>
                 </TouchableOpacity>
              </View>

              <View style={styles.chipsRow}>
                {[1, 5, 10, 50, 100].map(v => (
                  <Chip key={v} value={v} credits={credits} addBet={addBet} />
                ))}
                <TouchableOpacity style={styles.clearBtn} onPress={clearBets}>
                   <Feather name="x-circle" size={24} color="#D7263D" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.startBtn} onPress={initGame}>
                <Text style={styles.startBtnText}>DISTRIBUER</Text>
              </TouchableOpacity>
            </>
          )}

          {/* FOOTER CREDITS */}
          <Animated.View style={[styles.creditsBar, { 
             backgroundColor: barPulse.interpolate({ inputRange: [0, 1], outputRange: ['#2a2a2a', '#343434'] }),
             transform: [{ scale: barPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }] 
          }]}>
            <Text style={styles.creditsText}>{displayCredits} €</Text>
            {gainToShow !== 0 && (
              <Animated.View style={{ position: 'absolute', bottom: 80, alignSelf: 'center', opacity: gainOpacity, transform: [{translateY: gainTranslate}, {scale: gainScale}] }}>
                 <Text style={{ fontSize: 24, fontWeight: 'bold', color: gainToShow > 0 ? '#4CAF50' : '#D7263D', textShadowColor: 'black', textShadowRadius: 2 }}>
                    {gainToShow > 0 ? `+${gainToShow} €` : `${gainToShow} €`}
                 </Text>
              </Animated.View>
            )}
          </Animated.View>

        </View>
      </View>
    </>
  );
}

const ActionButton = ({ label, color, onPress, disabled }: any) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color, opacity: disabled ? 0.4 : 1 }]} onPress={disabled ? undefined : onPress}>
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A0000', alignItems: 'center', paddingTop: 20 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuText: { color: 'white', fontSize: 18, fontFamily: 'Cinzel', marginTop: 20 },
  infoBtn: { color: 'white', marginTop: 20 },
  gameArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  
  scoreText: { color: 'white', fontFamily: 'Cinzel', fontSize: 24, marginVertical: 5, textShadowColor: 'black', textShadowRadius: 2 },
  playerSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginTop: 10, minHeight: 120 },
  glow: { position: 'absolute', top: -10, bottom: -10, left: -10, right: -10, borderRadius: 16, backgroundColor: '#FFD700', zIndex: -1 },

  /* --- BETTING UI --- */
  betSelectionRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  betTarget: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#555', backgroundColor: 'rgba(0,0,0,0.3)' },
  betTargetActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.2)' },
  betTargetText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  betsDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 15, marginBottom: 20 },
  betBox: { alignItems: 'center', padding: 5 },
  mainBetBox: { borderBottomWidth: 2, borderBottomColor: '#FFD700', paddingBottom: 2 },
  betLabel: { color: '#ccc', fontSize: 10, textTransform: 'uppercase' },
  betValue: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },

  bonusFeedback: { position: 'absolute', top: 100, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8 },
  bonusText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },

  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  clearBtn: { padding: 5 },

  buttonsRow: { flexDirection: 'row', justifyContent: 'center', width: '90%', marginBottom: 20 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginHorizontal: 4, minWidth: 70, alignItems: 'center' },
  actionBtnText: { color: '#111', fontWeight: 'bold', fontSize: 12 },

  startBtn: { backgroundColor: '#FFD700', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, shadowColor: '#000', shadowRadius: 5, shadowOpacity: 0.5 },
  startBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 },

  creditsBar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#222', padding: 15, alignItems: 'center', borderTopWidth: 2, borderTopColor: '#444' },
  creditsText: { color: '#fff', fontSize: 28, fontWeight: 'bold', fontFamily: 'Cinzel' },

  /* MODALS */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#333', borderRadius: 10, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FFD700' },
  modalTitle: { color: '#FFD700', fontSize: 22, marginBottom: 10, fontWeight: 'bold' },
  modalText: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 20 },
  yesBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, width: 80, alignItems: 'center' },
  noBtn: { backgroundColor: '#D7263D', padding: 10, borderRadius: 5, width: 80, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold' },
});