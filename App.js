import { registerRootComponent } from 'expo';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Modal, ScrollView, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

const translations = {
  en: {
    header: "Grandma's Medicines",
    taken: "✅ Taken",
    addMedBtn: "+ Add Medicine",
    takenButton: "Taken",
    completed: "Completed",
    closeCalendar: "Close Calendar",
    successMsg: "marked as taken for",
    permNeeded: "Permission needed",
    permMsg: "Please allow notifications for medicine reminders.",
    tabSchedule: "Schedule",
    tabSummary: "Summary Report",
    totalTaken: "Total Doses Taken (This Month):",
    adherenceRate: "Adherence Rate:",
  },
  hi: {
    header: "दादी की दवाइयाँ",
    taken: "✅ ले लिया",
    addMedBtn: "+ दवा जोड़ें",
    takenButton: "ले लिया",
    completed: "पूरा हुआ",
    closeCalendar: "कैलेंडर बंद करें",
    successMsg: "के लिए ले लिया के रूप में चिह्नित किया गया",
    permNeeded: "अनुमति आवश्यक है",
    permMsg: "कृपया दवा के अनुस्मारक के लिए सूचनाओं की अनुमति दें।",
    tabSchedule: "शेड्यूल",
    tabSummary: "रिपोर्ट",
    totalTaken: "कुल ली गई खुराकें (इस महीने):",
    adherenceRate: "दवा पालन दर:",
  },
  te: {
    header: "అమ్మమ్మ మందులు",
    taken: "✅ తీసుకున్నారు",
    addMedBtn: "+ మందును జోడించు",
    takenButton: "తీసుకున్నాను",
    completed: "పూర్తయింది",
    closeCalendar: "క్యాలెండర్ మూసివేయి",
    successMsg: "తేదీకి మందు తీసుకున్నట్లు గుర్తించబడింది",
    permNeeded: "అనుమతి అవసరం",
    permMsg: "దయచేసి మందుల రిమైండర్ల కోసం నోటిఫికేషన్లను అనుమతించండి.",
    tabSchedule: "షెడ్యూల్",
    tabSummary: "నివేదిక",
    totalTaken: "మొత్తం తీసుకున్న మందులు (ఈ నెల):",
    adherenceRate: "అనుసరణ రేటు:",
  }
};

const initialMedicines = [
  { id: '1', nameEn: 'Gas (Rabeprazole)', nameHi: 'गैस (रैबेप्राजोल)', nameTe: 'గ్యాస్ (రాబెప్రజోల్)', displayTime: '06:00 AM', hour: 6, minute: 0, purposeEn: 'Gas / Acidity', purposeHi: 'गैस / एसिडिटी', purposeTe: 'గ్యాస్ / ఎసిడిటీ' },
  { id: '2', nameEn: 'Sugar (Reclimet)', nameHi: 'शुगर (रेक्लिमेट)', nameTe: 'షుగర్ (రెక్లిమెట్)', displayTime: '06:30 AM', hour: 6, minute: 30, purposeEn: 'Sugar Control', purposeHi: 'शुगर कंट्रोल', purposeTe: 'షుగర్ కంట్రోల్' },
  { id: '3', nameEn: 'BP tablet (Cilamet)', nameHi: 'बीपी टैबलेट (सिलामेट)', nameTe: 'బిపి ట్యాబ్లెట్ (సిలామెట్)', displayTime: '06:45 AM', hour: 6, minute: 45, purposeEn: 'Blood Pressure', purposeHi: 'ब्लड प्रेशर', purposeTe: 'బ్లడ్ ప్రెజర్' },
  { id: '4', nameEn: 'Dytor plus', nameHi: 'डाईटोर प्लस', nameTe: 'డైటర్ ప్లస్', displayTime: '07:30 AM', hour: 7, minute: 30, purposeEn: 'Water Pill / Heart', purposeHi: 'वॉटर पिल / दिल', purposeTe: 'వాటర్ పిల్ / గుండె' },
  { id: '5', nameEn: 'Lungs (Endobloc T kit)', nameHi: 'लंग्स (एंडोब्लॉक टी किट)', nameTe: 'ఊపిరితిత్తులు (ఎండోబ్లాక్ టి కిట్)', displayTime: '08:00 AM', hour: 8, minute: 0, purposeEn: 'Lungs / Breathing', purposeHi: 'फेफड़े / सांस', purposeTe: 'ఊపిరితిత్తులు / శ్వాస' },
  { id: '6', nameEn: 'Lungs capsule (Combihale)', nameHi: 'लंग्स कैप्सूल (कॉम्बीहेल)', nameTe: 'ఊపిరితిత్తుల క్యాప్సూల్ (కాంబిహేల్)', displayTime: '08:30 AM', hour: 8, minute: 30, purposeEn: 'Lungs / Inhaler Capsule', purposeHi: 'फेफड़े / कैप्सूल', purposeTe: 'ఊపిరితిత్తులు / క్యాప్సూల్' },
  { id: '7', nameEn: 'Lungs (Ranozen & AB-Flo)', nameHi: 'लंग्स (रानोजेन और एबी-फ्लो)', nameTe: 'ఊపిరితిత్తులు (రనోజెన్ & ఎబి-ఫ్లో)', displayTime: '09:00 AM', hour: 9, minute: 0, purposeEn: 'Lungs (2 tablets)', purposeHi: 'फेफड़े (2 गोलियां)', purposeTe: 'ఊపిరితిత్తులు (2 ట్యాబ్లెట్లు)' },
  { id: '8', nameEn: 'Mito Q7', nameHi: 'माइटो क्यू7', nameTe: 'మైటో క్యూ7', displayTime: '11:00 AM', hour: 11, minute: 0, purposeEn: 'Supplement', purposeHi: 'सप्लीमेंट', purposeTe: 'సప్లిమెంట్' },
  { id: '9', nameEn: 'Livegen-7', nameHi: 'लाइवजेन-7', nameTe: 'లైవ్‌జెన్-7', displayTime: '11:30 AM', hour: 11, minute: 30, purposeEn: 'Liver Health', purposeHi: 'लिवर स्वास्थ्य', purposeTe: 'కాలేయ ఆరోగ్యం' },
  { id: '10', nameEn: 'Ecosprin Gold 20', nameHi: 'इकोस्प्रिन गोल्ड 20', nameTe: 'ఎకోస్పిరిన్ గోల్డ్ 20', displayTime: '08:00 PM', hour: 20, minute: 0, purposeEn: 'For Blood / Heart', purposeHi: 'खून / दिल के लिए', purposeTe: 'రక్తం / గుండె కోసం' },
];

export default function App() {
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [dailyRecords, setDailyRecords] = useState({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [medicines, setMedicines] = useState(initialMedicines);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedPurpose, setNewMedPurpose] = useState('');
  const [newMedHour, setNewMedHour] = useState('09');
  const [newMedMinute, setNewMedMinute] = useState('00');
  const [newMedAmPm, setNewMedAmPm] = useState('AM');

  const t = translations[lang];

  useEffect(() => {
    requestPermissionsAndSetupChannel();
    
    // Listen to real-time updates from Firestore
    const householdDocRef = doc(db, "households", "grandma_home");
    
    const unsubscribe = onSnapshot(householdDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.medicines) setMedicines(data.medicines);
        if (data.dailyRecords) setDailyRecords(data.dailyRecords);
      } else {
        // Initialize default document if it doesn't exist yet
        setDoc(householdDocRef, {
          medicines: initialMedicines,
          dailyRecords: {}
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const requestPermissionsAndSetupChannel = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.permNeeded, t.permMsg);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine-alarms', {
        name: 'Medicine Alarms',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }
  };

  const scheduleDailyAlarm = async (med) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Time for Medicine!",
          body: `Please take your ${med.nameEn} scheduled for ${med.displayTime}. Tap 'Taken' in the app once completed.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          channelId: 'medicine-alarms',
        },
        trigger: {
          hour: med.hour,
          minute: med.minute,
          repeats: true,
        },
      });
    } catch (error) {
      console.log("Could not schedule alarm.");
    }
  };

  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const currentDateKey = getDateKey(selectedDate);
  const formattedDateDisplay = selectedDate.toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });

  const getMedicinesForSelectedDay = () => {
    const dayTakenState = dailyRecords[currentDateKey] || {};
    const mapped = medicines.map(med => ({
      id: med.id,
      name: lang === 'hi' ? (med.nameHi || med.nameEn) : lang === 'te' ? (med.nameTe || med.nameEn) : med.nameEn,
      purpose: lang === 'hi' ? (med.purposeHi || med.purposeEn) : lang === 'te' ? (med.purposeTe || med.purposeEn) : med.purposeEn,
      displayTime: med.displayTime,
      hour: med.hour,
      minute: med.minute,
      taken: !!dayTakenState[med.id]
    }));

    return mapped.sort((a, b) => {
      const totalMinutesA = a.hour * 60 + a.minute;
      const totalMinutesB = b.hour * 60 + b.minute;
      return totalMinutesA - totalMinutesB;
    });
  };

  const addNewMedicine = async () => {
    if (!newMedName.trim()) {
      Alert.alert("Missing Name", "Please enter a medicine name.");
      return;
    }

    let parsedHour = parseInt(newMedHour, 10);
    const parsedMinute = parseInt(newMedMinute, 10);

    if (isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12 || isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) {
      Alert.alert("Invalid Time", "Please enter valid hours (1-12) and minutes (0-59).");
      return;
    }

    let hour24 = parsedHour;
    if (newMedAmPm === 'PM' && parsedHour !== 12) {
      hour24 += 12;
    } else if (newMedAmPm === 'AM' && parsedHour === 12) {
      hour24 = 0;
    }

    const formattedDisplay = `${String(parsedHour).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')} ${newMedAmPm}`;

    const newMedItem = {
      id: Date.now().toString(),
      nameEn: newMedName,
      nameHi: newMedName,
      nameTe: newMedName,
      displayTime: formattedDisplay,
      hour: hour24,
      minute: parsedMinute,
      purposeEn: newMedPurpose || 'General Care',
      purposeHi: newMedPurpose || 'सामान्य देखभाल',
      purposeTe: newMedPurpose || 'సాధారణ సంరక్షణ',
    };

    scheduleDailyAlarm(newMedItem);
    const updatedMeds = [...medicines, newMedItem];
    
    // Save to Firestore
    const householdDocRef = doc(db, "households", "grandma_home");
    await setDoc(householdDocRef, { medicines: updatedMeds, dailyRecords }, { merge: true });

    setAddModalVisible(false);
    setNewMedName('');
    setNewMedPurpose('');
    setNewMedHour('09');
    setNewMedMinute('00');
    setNewMedAmPm('AM');
    Alert.alert("Success!", "New medicine added and synced to cloud.");
  };

  const deleteMedicine = async (id, medName) => {
    Alert.alert(
      "Delete Medicine",
      `Are you sure you want to stop tracking and remove ${medName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const updatedMeds = medicines.filter(med => med.id !== id);
            const householdDocRef = doc(db, "households", "grandma_home");
            await setDoc(householdDocRef, { medicines: updatedMeds, dailyRecords }, { merge: true });
          }
        }
      ]
    );
  };

  const markAsTaken = async (id, medName) => {
    const updatedRecords = {
      ...dailyRecords,
      [currentDateKey]: {
        ...(dailyRecords[currentDateKey] || {}),
        [id]: true
      }
    };
    
    setDailyRecords(updatedRecords);

    // Save to Firestore so children can see it instantly
    const householdDocRef = doc(db, "households", "grandma_home");
    await setDoc(householdDocRef, { medicines, dailyRecords: updatedRecords }, { merge: true });

    Alert.alert("Success! ✅", `${medName} ${t.successMsg} ${formattedDateDisplay}!`);
  };

  const changeDay = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const changeCalendarMonth = (offset) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCalendarViewDate(newDate);
  };

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const calculateMonthlyStats = () => {
    let totalTaken = 0;
    const currentMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    Object.keys(dailyRecords).forEach(dateKey => {
      if (dateKey.startsWith(currentMonthStr)) {
        const medsTakenOnDay = Object.keys(dailyRecords[dateKey]).filter(k => dailyRecords[dateKey][k]).length;
        totalTaken += medsTakenOnDay;
      }
    });

    const daysPassedInMonth = selectedDate.getDate();
    const totalExpected = daysPassedInMonth * medicines.length;
    const percentage = totalExpected > 0 ? Math.min(Math.round((totalTaken / totalExpected) * 100), 100) : 0;

    return { totalTaken, percentage };
  };

  const viewYear = calendarViewDate.getFullYear();
  const viewMonth = calendarViewDate.getMonth();
  const monthDays = getDaysInMonth(viewYear, viewMonth);
  const monthName = calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const currentMedicines = getMedicinesForSelectedDay();
  const stats = calculateMonthlyStats();

  return (
    <View style={styles.container}>
      <View style={styles.langBar}>
        <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.activeLang]} onPress={() => setLang('en')}>
          <Text style={[styles.langText, lang === 'en' && styles.activeLangText]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, lang === 'hi' && styles.activeLang]} onPress={() => setLang('hi')}>
          <Text style={[styles.langText, lang === 'hi' && styles.activeLangText]}>हिंदी</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.langBtn, lang === 'te' && styles.activeLang]} onPress={() => setLang('te')}>
          <Text style={[styles.langText, lang === 'te' && styles.activeLangText]}>తెలుగు</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>{t.header}</Text>

      <TouchableOpacity style={styles.addMedButton} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.addMedButtonText}>{t.addMedBtn}</Text>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'schedule' && styles.activeTab]} onPress={() => setActiveTab('schedule')}>
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>{t.tabSchedule}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'summary' && styles.activeTab]} onPress={() => setActiveTab('summary')}>
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>{t.tabSummary}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'schedule' ? (
        <>
          <View style={styles.dateNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => changeDay(-1)}>
              <Text style={styles.navButtonText}>◀ Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calendarTrigger} onPress={() => {
              setCalendarViewDate(selectedDate);
              setCalendarVisible(true);
            }}>
              <Text style={styles.dateText}>📅 {formattedDateDisplay}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={() => changeDay(1)}>
              <Text style={styles.navButtonText}>Next ▶</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={currentMedicines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, item.taken && styles.takenCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.medName}>{item.name}</Text>
                  {item.taken && <Text style={styles.checkmark}>{t.taken}</Text>}
                  <TouchableOpacity onPress={() => deleteMedicine(item.id, item.name)} style={styles.deleteIconBtn}>
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.medTime}>⏰ {item.displayTime}</Text>
                <Text style={styles.medPurpose}>{item.purpose}</Text>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.takenButtonWide, item.taken && styles.disabledButton]} 
                    onPress={() => markAsTaken(item.id, item.name)}
                    disabled={item.taken}
                  >
                    <Text style={styles.buttonText}>{item.taken ? t.completed : t.takenButton}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <ScrollView style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📊 {monthName} {t.tabSummary}</Text>
            <Text style={styles.summaryLabel}>{t.totalTaken}</Text>
            <Text style={styles.summaryValue}>{stats.totalTaken}</Text>

            <Text style={styles.summaryLabel}>{t.adherenceRate}</Text>
            <Text style={styles.summaryValue}>{stats.percentage}%</Text>
          </View>
        </ScrollView>
      )}

      {/* Add New Medicine Modal */}
      <Modal visible={addModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.alarmModalContent}>
            <Text style={styles.modalTitle}>Add New Medicine</Text>
            
            <TextInput
              style={styles.textInputField}
              placeholder="Medicine Name (e.g., Vitamin C)"
              value={newMedName}
              onChangeText={setNewMedName}
            />

            <TextInput
              style={styles.textInputField}
              placeholder="Purpose (e.g., Immunity)"
              value={newMedPurpose}
              onChangeText={setNewMedPurpose}
            />

            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                maxLength={2}
                value={newMedHour}
                onChangeText={setNewMedHour}
                placeholder="HH"
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                maxLength={2}
                value={newMedMinute}
                onChangeText={setNewMedMinute}
                placeholder="MM"
              />
              
              <TouchableOpacity 
                style={styles.ampmToggle} 
                onPress={() => setNewMedAmPm(newMedAmPm === 'AM' ? 'PM' : 'AM')}
              >
                <Text style={styles.ampmText}>{newMedAmPm}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveAlarmButton} onPress={addNewMedicine}>
              <Text style={styles.buttonText}>Save & Sync</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelAlarmButton} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.cancelAlarmText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.monthNavButton} onPress={() => changeCalendarMonth(-1)}>
                <Text style={styles.monthNavText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{monthName}</Text>
              <TouchableOpacity style={styles.monthNavButton} onPress={() => changeCalendarMonth(1)}>
                <Text style={styles.monthNavText}>▶</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.calendarGrid}>
              {monthDays.map((dateObj, index) => {
                const dKey = getDateKey(dateObj);
                const isSelected = dKey === currentDateKey;
                const hasRecords = dailyRecords[dKey] && Object.keys(dailyRecords[dKey]).length > 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.calendarDay, isSelected && styles.selectedDay, hasRecords && styles.recordedDay]}
                    onPress={() => {
                      setSelectedDate(dateObj);
                      setCalendarVisible(false);
                    }}
                  >
                    <Text style={[styles.calendarDayText, isSelected && styles.selectedDayText]}>
                      {dateObj.getDate()}
                    </Text>
                    {hasRecords && <Text style={styles.dot}>•</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.closeButtonText}>{t.closeCalendar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  langBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  langBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeLang: {
    backgroundColor: '#0275d8',
  },
  langText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  activeLangText: {
    color: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  addMedButton: {
    backgroundColor: '#5cb85c',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  addMedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
  },
  activeTabText: {
    color: '#0275d8',
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  navButton: {
    backgroundColor: '#0275d8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calendarTrigger: {
    padding: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0275d8',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  takenCard: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d9534f',
    flex: 1,
    marginRight: 10,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginRight: 8,
  },
  deleteIconBtn: {
    padding: 4,
  },
  deleteIconText: {
    fontSize: 18,
  },
  medTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0275d8',
    marginTop: 5,
  },
  medPurpose: {
    fontSize: 15,
    color: '#555',
    marginTop: 5,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  takenButtonWide: {
    backgroundColor: '#5cb85c',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '75%',
  },
  alarmModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  textInputField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: 55,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#f9f9f9',
  },
  timeColon: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  ampmToggle: {
    backgroundColor: '#0275d8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  ampmText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveAlarmButton: {
    backgroundColor: '#0275d8',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  cancelAlarmButton: {
    padding: 8,
    alignItems: 'center',
  },
  cancelAlarmText: {
    color: '#d9534f',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  monthNavButton: {
    backgroundColor: '#0275d8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  monthNavText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 45,
    height: 45,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedDay: {
    backgroundColor: '#0275d8',
    borderColor: '#0275d8',
  },
  recordedDay: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
  },
  dot: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: -4,
  },
  closeButton: {
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

registerRootComponent(App);