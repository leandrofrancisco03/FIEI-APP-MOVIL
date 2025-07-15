import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView 
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';

interface SemesterPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  semesters: string[];
  placeholder?: string;
}

export function SemesterPicker({ 
  value, 
  onValueChange, 
  semesters, 
  placeholder = 'Seleccionar semestre' 
}: SemesterPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (semester: string) => {
    onValueChange(semester);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#A0522D" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Semestre</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#A0522D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {semesters.map((semester) => (
                <TouchableOpacity
                  key={semester}
                  style={[
                    styles.option,
                    value === semester && styles.optionSelected
                  ]}
                  onPress={() => handleSelect(semester)}
                >
                  <Text style={[
                    styles.optionText,
                    value === semester && styles.optionTextSelected
                  ]}>
                    {semester}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DEB887',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 16,
    color: '#8B4513',
  },
  placeholder: {
    color: '#CD853F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DEB887',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF8DC',
  },
  optionSelected: {
    backgroundColor: '#FFF8DC',
  },
  optionText: {
    fontSize: 16,
    color: '#8B4513',
  },
  optionTextSelected: {
    color: '#D2691E',
    fontWeight: '600',
  },
});