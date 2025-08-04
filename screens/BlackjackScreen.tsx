import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ImageBackground } from 'react-native';
import { Card as CardType } from '../types/Card';
import Hand from '../components/Hand';
import { generateDeck } from '../utils/generateDeck';
import { getHandTotals } from '../utils/handTotals';
import Chip from '../components/Chip';
import { useNavigation } from '@react-navigation/native';
import RulesModal from '../components/RulesModal';
import Feather from '@expo/vector-icons/Feather';

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
  const [insuranceOffered, setInsuranceOffered] = useState<boolean>(false);
  const [insuranceBet, setInsuranceBet] = useState<number>(0);
  const [playerFlipped, setPlayerFlipped] = useState<boolean[]>([false, false]);
  const [dealerFlipped, setDealerFlipped] = useState<boolean[]>([false]);
  const [showRules, setShowRules] = useState<boolean>(false);

  /* ---------- CONSTANTS ---------- */
  const canSplit = gameStarted && playerTurn && playerHand.length === 2 && playerHand[0].value === playerHand[1].value;
  const isBlackjack = (hand: CardType[]) => hand.length === 2 && bestValue(hand) === 21;
  const dealerShowsAce = (dealerUp: CardType) => dealerUp.value === 'As';

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

  /* ---------- GAME FLOW ---------- */
  const initGame = () => {
    if (bet === 0) {
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
    const initialDealerHand = [d1];

    // On met d'abord à jour les mains ET les flips (tout au dos)
    setPlayerHand(initialPlayerHand);
    setDealerHand(initialDealerHand);
    setDeck(newDeck);

    setPlayerFlipped([false, false]);
    setDealerFlipped([false]);

    // Animation du flip décalé
    setTimeout(() => {
      setPlayerFlipped([true, false]);
    }, 500);

    setTimeout(() => {
      setDealerFlipped([true]);
    }, 1000);

    setTimeout(() => {
      setPlayerFlipped([true, true]);
    }, 1500);
    
    const playerBJ = isBlackjack([p1, p2]);
    const dealerUpIsAce = dealerShowsAce(d1);

    if (playerBJ && !dealerUpIsAce) {
      // Le joueur a un Blackjack & le croupier n'a ni As ni 10
      setCredits(c => c + bet * 2.5);
      setBet(0);
      setGameStarted(false);
      setPlayerTurn(false);
      setMessage('Blackjack ! Paiement 3 pour 2.');
    } else {
      // Partie normale
      setGameStarted(true);
      setPlayerTurn(!playerBJ);
      setMessage('');
      // Assurance si le croupier montre un As
      if (dealerUpIsAce) {
        setTimeout(() => setInsuranceOffered(true), 2000);};
    }
  };

const hit = () => {
  if (!playerTurn) return;
  const [card, newDeck] = drawCard(deck);

  setPlayerHand(prevHand => {
    const updatedHand = [...prevHand, card];

    setPlayerFlipped(prev => [...prev, false]);
    setTimeout(() => {
      setPlayerFlipped(prev => {
        const next = [...prev];
        next[next.length - 1] = true;
        return next;
      });

      const total = bestValue(updatedHand);
      if (total >= 21) {
        setTimeout(() => {
          setPlayerTurn(false);
        }, 1000); 
      }
    }, 500);

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
    setTimeout(() => {
      setPlayerTurn(false);
    }, 1000); 
  };

  const takeInsurance = () => {
    const maxIns = bet / 2;
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
    const playerScore = bestValue(playerHand);
    const dealerScore = bestValue(finalDealerHand);

    const playerBJ  = isBlackjack(playerHand);
    const dealerBJ  = isBlackjack(finalDealerHand);

    let resultMsg = '';

    /* ----- CAS BLACKJACKS ----- */
    if (playerBJ && dealerBJ) {
      resultMsg = 'Égalité !';
      setCredits(c => c + bet);
    } else if (playerBJ) {
      resultMsg = 'Blackjack ! Paiement 3 : 2.';
      setCredits(c => c + bet * 2.5);
    } else if (dealerBJ) {
      resultMsg = 'Le croupier a Blackjack. Tu perds ta mise.';
    }

    /* ----- CAS CLASSIQUES ----- */
    else if (playerScore > 21) {
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

    /* ===== PAIEMENT / PERTE ASSURANCE ===== */
    if (insuranceBet > 0) {
      if (dealerBJ) {
        // on rend insuranceBet + 2× gain  → total ×3
        setCredits(c => c + insuranceBet * 3);
        resultMsg += '\nAssurance payée 2:1.';
      } else {
        resultMsg += '\nAssurance perdue.';
      }
      setInsuranceBet(0);
    }

    /* ----- FIN DE MANCHE ----- */
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
    <>
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
              Le croupier montre un As/10.{'\n'}
              Tu peux assurer pour {bet / 2} € (paye 2:1).
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
          {/* <Image source={require('../assets/cartes/back.png')} style={styles.deckIcon} /> */}
        </View>

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

          {/* PLAYER */}
          <Hand cards={playerHand} flipped={playerFlipped} />
          <Text style={styles.scoreText}>{formatTotals(playerHand)}</Text>

          {/* BET & CONTROLS */}
          <Text style={styles.betText}>Mise : {bet} €</Text>
          
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
                <ActionButton label="Doubler"  color="#46B3E6" onPress={doubleDown} disabled={!playerTurn} />
                <ActionButton label="Split"    color="#F2C94C" /*onPress={}*/       disabled={!canSplit || !playerTurn} />
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
          <ImageBackground
            source={require('../assets/images/wood.png')}
            style={styles.creditsBar}
            imageStyle={styles.creditsBarImage}
          >
            <Text style={styles.creditsText}>{credits} €</Text>
          </ImageBackground>

        </View>
      </View>
    </>
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
  container: { flex: 1, backgroundColor: '#7A0000', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  menuText: { color: 'white', fontSize: 22, fontFamily: 'Cinzel', paddingTop: 30 },
  infoBtn: { color: 'white', paddingTop: 30 },
  deckIcon: { width: 60, height: 80, transform: [{ rotate: '20deg' }] },

  /* ---------- GAME AREA ---------- */
  gameArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },

  /* ---------- SCORES ---------- */
  scoreText: { color: 'white', fontFamily: 'Cinzel', fontSize: 30, marginVertical: 5 },
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
