import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ImageBackground, Animated, Easing } from 'react-native';
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

export default function BlackjackScreen() {
  /* ---------- STATE ---------- */
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHands, setPlayerHands] = useState<CardType[][]>([[]]);
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [bets, setBets] = useState<number[]>([0]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playerTurn, setPlayerTurn] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Commencer la partie');
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

  /* ---------- CONSTANTS ---------- */
  const canSplit = gameStarted && playerTurn && playerHands[currentHandIndex].length === 2 && playerHands[currentHandIndex][0].value === playerHands[currentHandIndex][1].value;
  const isBlackjack = (hand: CardType[]) => hand.length === 2 && bestValue(hand) === 21;
  const dealerShowsAce = (dealerUp: CardType) => dealerUp.value === 'As';
  const handScale = (len: number) => (len === 1 ? 1 : len === 2 ? 0.9 : 0.8);
  const markAction = () => setLastActionAt(Date.now());

  /* ---------- ANIMATIONS ---------- */
  const glow = useRef(new Animated.Value(0.6)).current;
  const [gainToShow, setGainToShow] = useState(0);
  const gainOpacity = useRef(new Animated.Value(0)).current;
  const gainTranslate = useRef(new Animated.Value(0)).current;
  const gainScale = useRef(new Animated.Value(0.8)).current;
  const isCreditAnimating = useRef(false);

  const barPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = creditAnim.addListener(({ value }) => {
      setDisplayCredits(Math.round(value));
    });
    return () => {
      creditAnim.removeListener(id);
    };
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
      // Compteur
      Animated.timing(creditAnim, {
        toValue,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),

      // Pastille flottante
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

      // Pulse de la barre
      Animated.sequence([
        Animated.timing(barPulse, { toValue: 1, duration: 160, useNativeDriver: false }),
        Animated.timing(barPulse, { toValue: 0, duration: 260, useNativeDriver: false }),
      ]),
    ]).start(() => {
      isCreditAnimating.current = false;
      setGainToShow(0);
    });
  };

  // Lance/stop l’animation quand on passe en mode split
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;

    if (playerHands.length > 1) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.65,   duration: 1200, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0.35, duration: 1200, useNativeDriver: false }),
        ])
      );
      loop.start();
    } else {
      glow.setValue(0.25);
    }

    return () => {
      loop?.stop?.();
    };
  }, [playerHands.length]);

  /* ---------- HELPERS ---------- */
  const drawCard = (currentDeck: CardType[]): [CardType, CardType[]] => {
    const newDeck = [...currentDeck];
    const card = newDeck.shift() as CardType;
    return [card, newDeck];
  };

  /* ---------- HELPERS ---------- */
  const navigation = useNavigation();

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

  /* ---------- TIMER ---------- */
  const TURN_DURATION = 15000; // 15s

  const currentHand = playerHands[currentHandIndex] ?? [];
  const isPlayerActive =
    gameStarted &&
    playerTurn &&
    currentHand.length > 0 &&
    !isBlackjack(currentHand) &&
    bestValue(currentHand) < 21;

  // Mets le timer en pause sur modales / phases bloquantes
  const paused = showRules || insuranceOffered;

  // À l’expiration : on passe le tour (équivaut à "Rester")
  const handleExpire = () => {
    if (!playerTurn) return;
    stand();
  };

  const { mmss, progress } = useTurnTimer({
    isActive: isPlayerActive,
    durationMs: TURN_DURATION,
    paused,
    onExpire: handleExpire,
    resetKey: [currentHandIndex, lastActionAt],
  });

  useEffect(() => {
    // Quand la manche commence / qu'on repasse au joueur / ou qu'on change de main → reset du timer
    if (gameStarted && playerTurn) {
      markAction();
    }
  }, [gameStarted, playerTurn, currentHandIndex]);
  /* ---------- FIN TIMER ---------- */

  /* ---------- GAME FLOW ---------- */
  const initGame = () => {
    if (bets[0] === 0) {
      setMessage('Place une mise avant !');
      return;
    }

    let newDeck = generateDeck();        // 6 decks par défaut
    const [p1, d1, p2] = [...Array(3)].map(() => {
      const [card, rest] = drawCard(newDeck);
      newDeck = rest;
      return card;
    });

    const initialPlayerHand = [p1, p2];
    // const initialPlayerHand = [
    //   { value: 'Huit', suit: 'Coeur', image: require('../assets/cartes/HuitDeCoeur.png') },
    //   { value: 'Huit', suit: 'Coeur', image: require('../assets/cartes/HuitDeCoeur.png') },

    // ];
    const initialDealerHand = [d1];

    // On met d'abord à jour les mains ET les flips (tout au dos)
    setPlayerHands([initialPlayerHand]);
    setCurrentHandIndex(0);
    setDealerHand(initialDealerHand);
    setDeck(newDeck);

    setPlayerFlipped([[false, false]]);
    setDealerFlipped([false]);

    // Animation du flip décalé
    setTimeout(() => {
      setPlayerFlipped([[true, false]]);
    }, 500);

    setTimeout(() => {
      setDealerFlipped([true]);
    }, 1000);

    setTimeout(() => {
      setPlayerFlipped([[true, true]]);
    }, 1500);
    
    const playerBJ = isBlackjack([p1, p2]);
    const dealerUpIsAce = dealerShowsAce(d1);

    if (playerBJ && !dealerUpIsAce) {
      // Le joueur a un Blackjack & le croupier n'a ni As ni 10
      setCredits(c => c + bets[0] * 2.5);
      setBets([0]);
      setGameStarted(false);
      setPlayerTurn(false);
      setMessage('Blackjack ! Paiement 3 pour 2.');
    } else {
      // Partie normale
      setGameStarted(true);
      setPlayerTurn(!playerBJ);
      setMessage('');

      markAction();
      
      // Assurance si le croupier montre un As
      if (dealerUpIsAce) {
        setTimeout(() => setInsuranceOffered(true), 2000);};
    }
  };

  const hit = () => {
    if (!playerTurn) return;
    const [card, newDeck] = drawCard(deck);

    setPlayerHands(prevHands => {
      const updatedHands = [...prevHands];
      const updatedCurrentHand = [...updatedHands[currentHandIndex], card];
      updatedHands[currentHandIndex] = updatedCurrentHand;

      // Animation du flip
      setPlayerFlipped(prev => {
        const next = [...prev];
        if (!next[currentHandIndex]) next[currentHandIndex] = [];
        next[currentHandIndex] = [...(next[currentHandIndex] || []), false];
        return next;
      });
      setTimeout(() => {
        setPlayerFlipped(prev => {
          const next = [...prev];
          next[currentHandIndex] = [...(next[currentHandIndex] || [])];
          next[currentHandIndex][updatedCurrentHand.length - 1] = true;
          return next;
        });

        const total = bestValue(updatedCurrentHand);
        if (total > 21) {
          if (currentHandIndex < updatedHands.length - 1) {
            setCurrentHandIndex(i => i + 1);
          } else {
            setTimeout(() => {
              setPlayerTurn(false);
            }, 1000);
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
    setBets(betsArr => {
      const arr = [...betsArr];
      arr[currentHandIndex] = arr[currentHandIndex] * 2;
      return arr;
    });
    hit();
    setTimeout(() => {
      setPlayerTurn(false);
    }, 1000); 
    markAction();
  };

  const splitHand = () => {
    const oldBets = [...bets];
    const newBet = oldBets[currentHandIndex];

    if (credits < newBet) {
      setMessage('Pas assez de crédits pour splitter !');
      return;
    }

    // Récupère la main actuelle
    const hands = [...playerHands];
    const handToSplit = hands[currentHandIndex];

    // Vérifie si la main peut être splittée
    if (
      hands.length >= 3 ||
      handToSplit.length !== 2 ||
      handToSplit[0].value !== handToSplit[1].value
    ) {
      setMessage('Impossible de splitter cette main.');
      return;
    }

    // On split les flips
    const oldFlips = playerFlipped[currentHandIndex] || [true, true];
    const newFlipped1 = [oldFlips[0], false];
    const newFlipped2 = [oldFlips[1], false];

    const newFlipped = [
      ...playerFlipped.slice(0, currentHandIndex),
      newFlipped1,
      newFlipped2,
      ...playerFlipped.slice(currentHandIndex + 1)
    ];

    setPlayerFlipped(newFlipped);

    const newHand1 = [handToSplit[0]];
    const newHand2 = [handToSplit[1]];
    let newDeck = [...deck];

    // On remplace la main actuelle par les deux nouvelles mains
    const newHands = [
      ...hands.slice(0, currentHandIndex),
      newHand1,
      newHand2,
      ...hands.slice(currentHandIndex + 1),
    ];

    const newBets = [
      ...oldBets.slice(0, currentHandIndex),
      newBet,
      newBet,
      ...oldBets.slice(currentHandIndex + 1),
    ];
    setBets(newBets);
    setCredits(c => c - newBet);

    setPlayerHands(newHands);
    setDeck(newDeck);

    setCurrentHandIndex(currentHandIndex);
    markAction();
  };

  const takeInsurance = () => {
    const maxIns = bets[0] / 2;
    if (credits >= maxIns) {
      setCredits(c => c - maxIns);
      setInsuranceBet(maxIns);
    }
    setInsuranceOffered(false);
  }
  
  const declineInsurance = () => {
    setInsuranceOffered(false);
  };

  /* ---------- DEALER LOGIC ---------- */
  useEffect(() => {
    if (!gameStarted || playerTurn) return;

    const dealerPlay = async () => {
      let dHand = [...dealerHand];
      let dDeck = [...deck];
      let dFlipped = [...dealerFlipped];

      // Ajoute la deuxième carte (si nécessaire) avec animation
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

      // Puis pour chaque carte tirée tant que le croupier doit piocher
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
      setDealerFlipped([...dFlipped]);
      setDeck(dDeck);
      resolveWinner(dHand);
    };

    dealerPlay();
  }, [playerTurn]);

  const resolveWinner = (finalDealerHand: CardType[]) => {
    const dealerScore = bestValue(finalDealerHand);
    
    let resultMsgs = [];
    let gain = 0;
    let mainPopupMsg = '';
    let mainPopupColor = '#fff';

    playerHands.forEach((hand, idx) => {
      const playerScore = bestValue(hand);
      const playerBJ = isBlackjack(hand);
      const dealerBJ = isBlackjack(finalDealerHand);

      let msg = `Main ${idx + 1} : `;

      /* ----- CAS BLACKJACKS ----- */
      if (playerBJ && dealerBJ) {
        msg = 'Égalité (Blackjack) !';
        gain += bets[idx];
        mainPopupMsg = 'ÉGALITÉ';
        mainPopupColor = '#FFD700';
      } else if (playerBJ) {
        msg = 'Blackjack ! Paiement 3:2.';
        gain += bets[idx] * 2.5;
        mainPopupMsg = 'BLACKJACK 🎉';
        mainPopupColor = '#4CAF50';
      } else if (dealerBJ) {
        msg = 'Le croupier a Blackjack. Perdu.';
        mainPopupMsg = 'DÉFAITE ❌';
        mainPopupColor = '#D7263D';
      }

      /* ----- CAS CLASSIQUES ----- */
      else if (playerScore > 21) {
        msg = 'Bust ! Le croupier gagne.';
        mainPopupMsg = 'BUST ❌';
        mainPopupColor = '#D7263D';
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        msg = 'Tu gagnes !';
        gain += bets[idx] * 2;
        mainPopupMsg = 'VICTOIRE 🎉';
        mainPopupColor = '#4CAF50';
      } else if (playerScore === dealerScore) {
        msg = 'Égalité.';
        gain += bets[idx];
        mainPopupMsg = 'ÉGALITÉ';
        mainPopupColor = '#FFD700';
      } else {
        msg = 'Le croupier gagne.';
        mainPopupMsg = 'DÉFAITE ❌';
        mainPopupColor = '#D7263D';
      }

      resultMsgs.push(msg);
    });

    /* ===== PAIEMENT / PERTE ASSURANCE ===== */
    if (insuranceBet > 0) {
      if (isBlackjack(finalDealerHand)) {
        // on rend insuranceBet + 2× gain  → total ×3
        gain += insuranceBet * 3;
        resultMsgs.push('Assurance payée 2:1.');
      } else {
        resultMsgs.push('Assurance perdue.');
      }
      setInsuranceBet(0);
    }

    /* ----- FIN DE MANCHE ----- */
    const oldCredits = credits;
    const newCredits = oldCredits + gain;
    
    animateCreditChange(gain, newCredits);

    setCredits(c => c + gain);
    setMessage(resultMsgs.join('\n'));
    setGameStarted(false);
    setBets([0]);

    setPopupMessage(mainPopupMsg);
    setPopupColor(mainPopupColor);
    setPopupVisible(true);
  };


  const addBet = (amount: number) => {
    if (!gameStarted && credits >= amount) {
      setBets(prev => [prev[0] + amount]);
      setCredits(c => c - amount);
    }
  }

  /* ---------- RENDER ---------- */
  return (
    <>
      <GameResultPopup
        visible={popupVisible}
        message={popupMessage}
        color={popupColor}
        onHide={() => setPopupVisible(false)}
      />
      {/* MODAL ASSURANCE */}
      <Modal
        visible={insuranceOffered}
        transparent
        animationType="fade"
      >
        <View style={styles.backdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assurance ?</Text>
            <Text style={styles.modalText}>
              Le croupier montre un As.{'\n'}
              Tu peux assurer pour {bets[0] / 2} € (paye 2:1).
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.yesBtn} onPress={takeInsurance}>
                <Text style={styles.btnTxt}>Assurer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noBtn} onPress={declineInsurance}>
                <Text style={styles.btnTxt}>Non merci</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.menuText}>← Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRules(true)}>
            <Feather name="info" style={styles.infoBtn} size={24} />
          </TouchableOpacity>
        </View>

        {/* ANNEAU TIMER — centré en haut, entre Menu et Info */}
        <TurnTimerRing
          visible={isPlayerActive}
          mmss={mmss}
          progress={progress}
          style={{ position: "absolute", top: 40, alignSelf: "center" }}
        />

        {/* Dans BlackjackScreen.tsx */}
        <RulesModal visible={showRules} onClose={() => setShowRules(false)} />

        {/* DEALER */}
        <View style={styles.gameArea}>

          <Hand cards={dealerHand} flipped={dealerFlipped}/>
          <Text style={styles.scoreText}>
            { !gameStarted || !playerTurn ? formatTotals(dealerHand) : '' }
          </Text>

          {/* RÈGLES CENTER */}
          <Text style={styles.rules}>
            Blackjack paie 3 pour 2{'\n'}
            Le croupier tire à 16 et reste à 17{'\n'}
            Assurance paie 2 pour 1
          </Text>

          {/* JOUEUR */}
          <View style={{ flexDirection: 'row', justifyContent: playerHands.length === 1 ? 'center' : 'space-evenly', alignItems: 'flex-end', gap: 16, paddingTop: 10 }}>
            {playerHands.map((hand, idx) => {
              const isActive = playerHands.length > 1 && idx === currentHandIndex;

              return (
                    <Animated.View
                      key={idx}
                      style={{ alignItems: 'center', position: 'relative', marginHorizontal: 12 }}
                    >
                      {/* HALO DERRIÈRE (aucune bordure) */}
                      {isActive && (
                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            top: -10, bottom: -10, left: -10, right: -10,
                            borderRadius: 16,
                            backgroundColor: '#FFD700',
                            opacity: glow as any,
                            zIndex: -1,
                          }}
                        />
                      )}

                      <Hand
                        cards={hand}
                        flipped={playerFlipped[idx]}
                        stacked={playerHands.length > 1}
                        scale={handScale(playerHands.length)}
                      />

                      <Text style={styles.scoreText}>{formatTotals(hand)}</Text>
                      <Text style={styles.betText}>Mise : {bets[idx]} €</Text>
                    </Animated.View>
                  );
            })}
          </View>

          
          {insuranceBet > 0 && (
            <Text style={styles.insuranceText}>
              Assurance : {insuranceBet} €
            </Text>
          )}

          {gameStarted ? (
            <>
              <View style={styles.buttonsRow}>
                <ActionButton label="Tirer"    color="#D7263D" onPress={hit}        disabled={!playerTurn} />
                <ActionButton label="Rester"   color="#1FA774" onPress={stand}      disabled={!playerTurn} />
                <ActionButton label="Doubler"  color="#46B3E6" onPress={doubleDown} disabled={!playerTurn || playerHands.length > 1} />
                { canSplit && (
                  <ActionButton label="Split"    color="#F2C94C" onPress={splitHand}  disabled={!canSplit || !playerTurn} />
                )}
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
          {/* <ImageBackground source={require('../assets/images/wood.png')} style={styles.creditsBar} imageStyle={styles.creditsBarImage}>
            <Text style={styles.creditsText}>{credits} €</Text>
          </ImageBackground> */}
          
          {/* FOOTER (CREDITS) */}
          <Animated.View
            style={[ styles.creditsBar,
              { backgroundColor: barPulse.interpolate({ inputRange: [0, 1], outputRange: ['#2a2a2a', '#343434'] }) as any,
                transform: [{ scale: barPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02], }) as any
                }],
                shadowOpacity: barPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.35],
                }) as any,
                shadowRadius: barPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 12],
                }) as any,
              }
            ]}
          >
            <Text style={styles.creditsText}>{displayCredits} €</Text>

            {/* Pastille de gain/perte (centrée) */}
{gainToShow !== 0 && (
  <Animated.View
    pointerEvents="none"
    style={{
      position: 'absolute',
      left: '20%',
      right: 0,
      bottom: 75,
      alignItems: 'center',
      opacity: gainOpacity,
      transform: [{ translateY: gainTranslate }, { scale: gainScale }],
    }}
  >
    <Text
      style={{
        fontSize: 18,
        fontWeight: '800',
        color: gainToShow > 0 ? '#15c46b' : '#ff4757',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
      }}
    >
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

/* ---------- PETITS COMPONENT BOUTONS ---------- */
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
  container: { flex: 1, backgroundColor: '#7A0000', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuText: { color: 'white', fontSize: 22, fontFamily: 'Cinzel', paddingTop: 30 },
  infoBtn: { color: 'white', paddingTop: 30 },
  deckIcon: { width: 60, height: 80, transform: [{ rotate: '20deg' }] },

  /* ---------- GAME AREA ---------- */
  gameArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },

  /* ---------- MAIN DU JOUEUR ---------- */
  activeHand: { borderWidth: 3, borderColor: '#FFD700', borderRadius: 8, shadowColor: '#FFD700', shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, elevation: 10, padding: 10, paddingRight: 20 },

  /* ---------- SCORES ---------- */
  scoreText: { color: 'white', fontFamily: 'Cinzel', textAlign: 'center', fontSize: 30, marginVertical: 5 },
  rules: { color: '#EEE', fontSize: 16, fontFamily: 'Cinzel', textAlign: 'center', marginVertical: 5 },

  /* ---------- MISE ET ASSURANCE ---------- */
  betText: { color: '#EEE', fontFamily: 'Cinzel', marginVertical: 10 },
  insuranceText: { color: '#6EC6FF', fontFamily: 'Cinzel', marginBottom: 4 },

  /* ---------- BOUTONS D'ACTION ---------- */
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '80%', marginVertical: 16 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 6, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  actionBtnText: { color: '#111', fontFamily: 'Cinzel', fontWeight: '700' },

  /* ---------- SELECTEUR DE MISE ---------- */
  chipsRow: { flexDirection: 'row', marginVertical: 15, justifyContent: 'center' },

  /* ---------- START BUTTON ---------- */
  startBtn: { backgroundColor: '#DDD', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  startBtnText: { color: '#111', fontFamily: 'Cinzel', fontWeight: '600' },

  /* ---------- MESSAGE DE WIN/LOSE ---------- */
  info: { color: '#FFD700', fontFamily: 'Cinzel', marginTop: 10 },

  /* ---------- CREDITS ---------- */
  creditsBar: { position: 'absolute', bottom: 0, width: '120%', backgroundColor: '#865C2D', padding: 20 },
  creditsBarImage: { resizeMode: 'cover' },
  creditsText: { color: 'white', textAlign: 'center', fontFamily: 'Cinzel', fontSize: 32, fontWeight: '700', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },

  /* ---------- MODAL ASSURANCE ---------- */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: '#222', borderRadius: 8, padding: 20, alignItems: 'center' },
  modalTitle: { color: '#FFD700', fontFamily: 'Cinzel', fontSize: 20, marginBottom: 8 },
  modalText: { color: '#EEE', fontFamily: 'Cinzel', textAlign: 'center', marginBottom: 15 },
  modalBtns: { flexDirection: 'row' },
  yesBtn: { backgroundColor: '#1FA774', padding: 10, borderRadius: 6, marginHorizontal: 5 },
  noBtn:  { backgroundColor: '#D7263D', padding: 10, borderRadius: 6, marginHorizontal: 5 },
  btnTxt: { color: '#fff', fontFamily: 'Cinzel', fontWeight: '600' },
});
