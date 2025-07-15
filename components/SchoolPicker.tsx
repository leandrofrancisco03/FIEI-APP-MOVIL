import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView 
} from 'react-native';
import { GraduationCap, ChevronDown, X } from 'lucide-react-native';

interface School {
  id: number;
  nombre: string;
}

interface SchoolPickerProps {
  value?: number;
  onValueChange: (value: number) => void;
  schools: School[];
  placeholder?: string;
  label?: string;
  error?: string;
}

export function SchoolPicker({ 
  value, 
  onValueChange, 
  schools, 
  placeholder = 'Seleccionar escuela',
  label,
  error
}: SchoolPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedSchool = schools.find(school => school.id === value);

  const handleSelect = (schoolId: number) => {
    onValueChange(schoolId);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <GraduationCap size={20} color="#A0522D" />
          <Text style={[styles.text, !selectedSchool && styles.placeholder]}>
            {selectedSchool ? selectedSchool.nombre : placeholder}
          </Text>
        </View>
        <ChevronDown size={20} color="#A0522D" />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Escuela</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#A0522D" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school.id}
                  style={[
                    styles.option,
                    value === school.id && styles.optionSelected
                  ]}
                  onPress={() => handleSelect(school.id)}
                >
                  <GraduationCap 
                    size={20} 
                    color={value === school.id ? '#D2691E' : '#A0522D'} 
                  />
                  <Text style={[
                    styles.optionText,
                    value === school.id && styles.optionTextSelected
                  ]}>
                    {school.nombre}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 6,
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
  selectorError: {
    borderColor: '#DC143C',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#8B4513',
    marginLeft: 12,
  },
  placeholder: {
    color: '#CD853F',
  },
  error: {
    fontSize: 12,
    color: '#DC143C',
    marginTop: 4,
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
    width: '90%',
    maxHeight: '70%',
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
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 12,
    flex: 1,
  },
  optionTextSelected: {
    color: '#D2691E',
    fontWeight: '600',
  },
});