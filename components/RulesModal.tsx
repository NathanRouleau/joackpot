import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
};

export default function RulesModal({ visible, onClose, title = "🃏 Règles du Blackjack" }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <ScrollView>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.sectionTitle}>🎯 Objectif</Text>
            <Text style={styles.paragraph}>
              Battre le croupier sans dépasser <Text style={styles.bold}>21</Text>.
            </Text>

            <Text style={styles.sectionTitle}>🃏 Valeur des cartes</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2 à 10 :</Text> valeur numérique{"\n"}
              <Text style={styles.bold}>Valet, Dame, Roi :</Text> 10{"\n"}
              <Text style={styles.bold}>As :</Text> 1 ou 11 (selon ce qui t’arrange)
            </Text>

            <Text style={styles.sectionTitle}>🧑‍🤝‍🧑 Déroulement d'une partie</Text>
            <Text style={styles.paragraph}>
              2 cartes pour toi, 1 carte visible pour le croupier{"\n"}
              {"\n"}Tu choisis ce que tu veux faire :{"\n"}
              <Text style={styles.bold}>Tirer (Hit) :</Text> Prendre une carte{"\n"}
              <Text style={styles.bold}>Rester (Stand) :</Text> Garder ta main{"\n"}
              <Text style={styles.bold}>Doubler (Double Down) :</Text> Tu doubles ta mise, tu prends 1 seule carte, et tu t’arrêtes là.{"\n"}
              <Text style={styles.bold}>Séparer (Split) :</Text> Si t’as 2 cartes identiques, tu fais 2 mains séparées (et mises doublées). Split autorisé 2 fois si t'as 3 cartes identiques.
            </Text>

            <Text style={styles.sectionTitle}>🧠 Assurance</Text>
            <Text style={styles.paragraph}>
              Si le croupier a un <Text style={styles.bold}>As</Text>, tu peux parier qu’il va faire Blackjack.{"\n"}
              Si c’est le cas → <Text style={styles.bold}>tu gagnes 2:1 sur l’assurance</Text>.{"\n"}
              Si ce n’est pas un blackjack → tu perds l’assurance (et continue ta main normalement).
            </Text>

            <Text style={styles.sectionTitle}>♦️ Bonus (Mises annexes)</Text>
            <Text style={styles.subSection}>Dame de coeur</Text>
            <Text style={styles.paragraph}>
              Prend en compte les 2 premières cartes du joueur{"\n"}
              <Text>• 2 cartes quelconques = 20 : Mise 4:1</Text>{"\n"}
              <Text>• 2 cartes de même couleur = 20 : Mise 9:1</Text>{"\n"}
              <Text>• Paire de même couleur = 20 : Mise 19:1</Text>{"\n"}
              <Text>• Paire Dames de coeur : Mise 125:1</Text>
            </Text>

            <Text style={styles.subSection}>21 + 3</Text>
            <Text style={styles.paragraph}>
              Prend en compte les 2 premières cartes du joueur + la première carte du croupier{"\n"}
              <Text>• Flush (3 cartes même couleur) : Mise 5:1</Text>{"\n"}
              <Text>• Tierce (3 cartes qui se suivent) : Mise 10:1</Text>{"\n"}
              <Text>• Brelan (3 cartes même valeur) : Mise 20:1</Text>{"\n"}
              <Text>• Tierce flush : Mise 30:1</Text>
            </Text>

            <Text style={styles.sectionTitle}>🏦 Croupier</Text>
            <Text style={styles.paragraph}>
              • Tire jusqu’à 16 (inclus) minimum.{"\n"}
              • S'arrête à 17.{"\n"}
              • S’il dépasse 21 → <Text style={styles.bold}>bust</Text>, tu gagnes.
            </Text>

            <Text style={styles.sectionTitle}>💸 Paiement</Text>
            <Text style={styles.paragraph}>
              <Text>Blackjack naturel (As + 10 direct) →</Text>
              <Text style={styles.bold}> 1,5x ta mise</Text>
              {"\n"}Victoire simple → <Text style={styles.bold}>1x ta mise</Text>
              {"\n"}Égalité → <Text style={styles.bold}>Tu récupères ta mise.</Text>
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#1c1b19',
    borderRadius: 12,
    width: '95%',
    height: '88%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 12,
  },
  title: {
    color: '#FFD700',
    fontFamily: 'Cinzel-Bold',
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },

  // ------ Close Button ------ //
  closeBtn: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 25, borderRadius: 16, alignSelf: 'center', marginTop: 10 },
  closeBtnText: { color: '#222', fontWeight: 'bold', fontSize: 18, fontFamily: 'Cinzel-Bold'},

  // ------ Styles ------ //  
  sectionTitle: { color: '#FFD700', fontFamily: 'Cinzel-Bold', fontSize: 20, marginTop: 18, marginBottom: 6 },
  subSection: { color: '#6EC6FF', fontFamily: 'Cinzel-Bold', fontSize: 16, marginTop: 10, marginBottom: 4 },
  paragraph: { color: '#EEE', fontFamily: 'Cinzel', fontSize: 15, marginBottom: 8, lineHeight: 24 },
  bold: { fontWeight: 'bold', color: '#FFF', },
  italic: { fontStyle: 'italic'},

});
