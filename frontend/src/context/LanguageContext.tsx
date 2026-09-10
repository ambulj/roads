import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'ta';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation & Layout
    "nav.command": "Command Center",
    "nav.incidents": "Incidents & Enforcement",
    "nav.memory": "Road Intelligence",
    "nav.analytics": "Analytics & Reports",
    "nav.fleet": "Fleet Telemetry",
    "nav.workOrders": "Work Orders & 3D",
    "nav.capture": "Edge Dashcam Ingest",
    "nav.reportIssue": "Report Issue",
    "nav.search": "Search",
    "nav.live": "Live",
    "nav.demo": "Demo Mode",
    "nav.jurisdiction": "Jurisdiction",
    "nav.authorized": "Authorized",
    "nav.views": "Views",

    // Header & Tools
    "header.title": "RoadSaarthi",
    "header.subtitle": "Chennai Intelligence",
    "header.searchPlaceholder": "Search buses, corridors, incidents... (Ctrl+K)",
    "header.tools": "Tools",
    "header.toolsTitle": "Executive Tools & Actions",
    "header.whatIf": "What-If Intervention",
    "header.whatIfSub": "Simulate road repair actions",
    "header.aiWeights": "AI Weights & Streams",
    "header.aiWeightsSub": "Zero-hardware RTSP & .pt models",
    "header.sensorFusion": "Sensor Fusion (<45ms)",
    "header.sensorFusionSub": "AIS-140 & RTSP Zero-Hardware Engine",
    "header.pdfSummons": "1-Click PDF Summons",
    "header.pdfSummonsSub": "Contractor liquidated damages notice",
    "header.soundAlerts": "Sound Alerts",
    "header.shortcuts": "Keyboard Hotkeys",
    "header.notifications": "Notifications",
    "header.switchRole": "Switch Officer Persona",
    "header.signOut": "Sign Out of Console",
    "header.activeSession": "Active Session",

    // KPIs & Metrics
    "kpi.activeBuses": "Active Buses",
    "kpi.roadHazards": "Road Hazards",
    "kpi.waterlogging": "Waterlogging",
    "kpi.congestionZones": "Congestion Zones",
    "kpi.workOrders": "Work Orders",
    "kpi.nodes": "Nodes",

    // Defects & Hazards
    "defect.pothole": "Pothole",
    "defect.alligator": "Alligator Crack",
    "defect.transverse": "Transverse Crack",
    "defect.linear": "Surface Line Crack",
    "defect.waterlog": "Waterlogging",
    "defect.zebra": "Zebra Crossing",
    "defect.fadedZebra": "Faded Zebra Crossing",
    "defect.unmarkedHump": "Unmarked Speed Breaker",
    "defect.illegalHump": "Illegal Speed Hump",
    "defect.darkSpot": "Dark Spot / Streetlight Outage",
    "defect.openManhole": "Open Sewer Manhole",
    "defect.sunkenTrench": "Sunken Utility Trench",
    "defect.submergedPothole": "Submerged Invisible Pothole",
    "defect.foliageSign": "Tree-Obscured Road Sign",
    "defect.bannerSign": "Banner-Obscured Sign",
    "defect.criticalPotholes": "Critical Potholes",
    "defect.hitAndRun": "Hit & Run Collision",
    "defect.congestion": "Severe Congestion",

    // Severities
    "sev.critical": "Critical",
    "sev.high": "High",
    "sev.medium": "Medium",
    "sev.low": "Low",

    // Statuses
    "status.open": "Open",
    "status.assigned": "Assigned",
    "status.under_repair": "Under Repair",
    "status.resolved": "Resolved",
    "status.verified_closed": "Verified Closed",

    // UI & Action Buttons
    "ui.filter": "Filter",
    "ui.export": "Export",
    "ui.refresh": "Refresh",
    "ui.inspect": "Inspect",
    "ui.evidence": "Evidence & Telemetry",
    "ui.dispatch": "Dispatch Unit",
    "ui.close": "Close",
    "ui.submit": "Submit",
    "ui.moRTH": "MoRTH IRC:SP:134-2023",
    "ui.slaActive": "24h SLA Active",
    "ui.passes": "passes",
    "ui.rpi": "RPI Score",
    "ui.before": "Before Repair",
    "ui.after": "After Repair",
    "ui.contractor": "Contractor Agency",
    "ui.autoCloseNotice": "Auto-Verified Closed via Fleet Re-pass",
    "ui.submitReport": "Submit Pothole Report",
    "ui.camera": "Camera Feed",
    "ui.uploadPhoto": "Upload Photo",
    "ui.location": "Road Location",
    "ui.description": "Description",
    "ui.ticketGenerated": "Ticket Generated Successfully",
    "ui.autoVerify": "Auto-Verify & Close Resolved Potholes",
    "ui.jalBoardAlert": "IS:1726 Jal Board Emergency Alert",
    "ui.debarmentLedger": "Contractor Debarment Matrix (GeM)",
    "ui.asphaltQC": "Asphalt Temp & QC Audit",

    // Incidents & Police Dispatch
    "incidents.title": "Road Safety Incidents & Multi-Agency Enforcement",
    "incidents.subtitle": "Real-time AI edge detections cross-referenced with MTC Bus Telemetry, GPS, and ANPR.",
    "incidents.pcrDispatch": "Trigger 112 Police Dispatch",
    "incidents.pcrSent": "Police Signal Dispatched",
    "incidents.multiBusSightings": "Multi-Bus ANPR Sighting Ring",
    "incidents.generateSummons": "Generate Legal Summons",
    "incidents.slaTimer": "SLA Resolution Timer",

    // Fleet Telemetry
    "fleet.title": "Fleet Telemetry & Mobile Dashcam Ingest",
    "fleet.liveFeed": "Live Video Feed",
    "fleet.imuSensors": "5Hz IMU Accelerometer",
    "fleet.gpsLocation": "AIS-140 GPS Telemetry",
    "fleet.aiRadio": "AI Voice Dispatcher",
    "fleet.takeSnapshot": "Capture Snapshot",
    "fleet.speed": "Speed",
    "fleet.vibration": "Vibration",

    // Autonomous Lifecycle & Auto-Verification
    "lifecycle.title": "Autonomous Defect-to-Closure Lifecycle",
    "lifecycle.subtitle": "Edge AI Detection -> Auto-Case Open -> SLA Repair -> Fleet Re-Pass Autonomous Closure",
    "lifecycle.runDrill": "Simulate Auto-Detection -> Re-Pass Closure",
    "lifecycle.runningDrill": "Simulating Autonomous Lifecycle...",
    "lifecycle.autoDetected": "Auto-Detected (Bus AI Edge)",
    "lifecycle.autoVerified": "Auto-Verified Closed (Fleet Re-Pass)",
    "lifecycle.step1": "1. Edge AI IMX335 + IMU Shock Detection",
    "lifecycle.step2": "2. Auto-Case Creation & SLA Active",
    "lifecycle.step3": "3. Contractor Hot-Mix Asphalt Patch",
    "lifecycle.step4": "4. Transit Fleet Re-Pass Auto-Verification (Gz < 1.05g)",
    "lifecycle.successNotice": "Pothole case automatically verified & closed via Fleet Re-Pass!",

    // Analytics
    "analytics.title": "Municipal Infrastructure Analytics & PCI Decay",
    "analytics.monsoonInundation": "Monsoon Inundation & Micro-Elevation Radar",
    "analytics.pciForecast": "6-Month PCI Decay Forecast",
    "analytics.contractorDebarment": "Contractor Escrow & Debarment Risk"
  },
  hi: {
    // Navigation & Layout
    "nav.command": "कमान केंद्र",
    "nav.incidents": "घटनाएं एवं प्रवर्तन",
    "nav.memory": "सड़क बुद्धिमत्ता",
    "nav.analytics": "डेटा विश्लेषण व रिपोर्ट",
    "nav.fleet": "बस बेड़ा टेलीमेट्री",
    "nav.workOrders": "कार्य आदेश व 3D",
    "nav.capture": "डैशकैम इनपुट",
    "nav.reportIssue": "समस्या दर्ज करें",
    "nav.search": "खोजें",
    "nav.live": "लाइव",
    "nav.demo": "डेमो मोड",
    "nav.jurisdiction": "अधिकार क्षेत्र",
    "nav.authorized": "अधिकृत",
    "nav.views": "दृश्य",

    // Header & Tools
    "header.title": "रोडसारथी",
    "header.subtitle": "चेन्नई इंटेलिजेंस",
    "header.searchPlaceholder": "बसें, सड़कें, घटनाएं खोजें... (Ctrl+K)",
    "header.tools": "उपकरण",
    "header.toolsTitle": "कार्यकारी उपकरण व क्रियाएं",
    "header.whatIf": "क्या-अगर हस्तक्षेप सिमुलेशन",
    "header.whatIfSub": "सड़क मरम्मत क्रियाओं का अनुकरण",
    "header.aiWeights": "एआई मॉडल एवं कैमरा स्ट्रीम",
    "header.aiWeightsSub": "शून्य-हार्डवेयर RTSP और .pt मॉडल",
    "header.sensorFusion": "सेंसर फ्यूज़न (<45ms)",
    "header.sensorFusionSub": "AIS-140 एवं RTSP शून्य-हार्डवेयर इंजन",
    "header.pdfSummons": "1-क्लिक कानूनी समन",
    "header.pdfSummonsSub": "ठेकेदार जुर्माना और नोटिस",
    "header.soundAlerts": "ध्वनि अलर्ट",
    "header.shortcuts": "कीबोर्ड शॉर्टकट",
    "header.notifications": "सूचनाएं",
    "header.switchRole": "अधिकारी पद बदलें",
    "header.signOut": "लॉग आउट करें",
    "header.activeSession": "सक्रिय सत्र",

    // KPIs & Metrics
    "kpi.activeBuses": "सक्रिय बसें",
    "kpi.roadHazards": "सड़क खतरे",
    "kpi.waterlogging": "जलभराव",
    "kpi.congestionZones": "जाम क्षेत्र",
    "kpi.workOrders": "कार्य आदेश",
    "kpi.nodes": "नोड्स",

    // Defects & Hazards
    "defect.pothole": "सड़क का गड्ढा",
    "defect.alligator": "गंभीर जाल दरार",
    "defect.transverse": "चौड़ाई दरार",
    "defect.linear": "सतह की सीधी दरार",
    "defect.waterlog": "सड़क जलभराव",
    "defect.zebra": "पैदल क्रॉसिंग (जेब्रा)",
    "defect.fadedZebra": "धुंधली पैदल क्रॉसिंग",
    "defect.unmarkedHump": "अचिह्नित गति अवरोधक",
    "defect.illegalHump": "अवैध गति अवरोधक (हम्प)",
    "defect.darkSpot": "अंधेरा क्षेत्र (स्ट्रीटलाइट बंद)",
    "defect.openManhole": "खुला सीवर मैनहोल",
    "defect.sunkenTrench": "धंसी हुई यूटिलिटी ट्रेंच",
    "defect.submergedPothole": "जलमग्न अदृश्य गड्ढा",
    "defect.foliageSign": "पेड़ों से ढका यातायात बोर्ड",
    "defect.bannerSign": "बैनर से ढका साइनबोर्ड",
    "defect.criticalPotholes": "गंभीर गड्ढे",
    "defect.hitAndRun": "टक्कर मारकर भागना (Hit & Run)",
    "defect.congestion": "गंभीर ट्रैफिक जाम",

    // Severities
    "sev.critical": "अति गंभीर",
    "sev.high": "उच्च",
    "sev.medium": "मध्यम",
    "sev.low": "सामान्य",

    // Statuses
    "status.open": "सक्रिय (खुला)",
    "status.assigned": "ठेकेदार को आवंटित",
    "status.under_repair": "मरम्मत जारी",
    "status.resolved": "मरम्मत पूर्ण",
    "status.verified_closed": "सत्यापित बंद",

    // UI & Action Buttons
    "ui.filter": "फ़िल्टर",
    "ui.export": "निर्यात",
    "ui.refresh": "ताज़ा करें",
    "ui.inspect": "निरीक्षण करें",
    "ui.evidence": "साक्ष्य व फोटो",
    "ui.dispatch": "दस्ता रवाना करें",
    "ui.close": "बंद करें",
    "ui.submit": "जमा करें",
    "ui.moRTH": "सड़क परिवहन मंत्रालय (MoRTH)",
    "ui.slaActive": "24 घंटे की समय सीमा सक्रिय",
    "ui.passes": "बस निरीक्षण चक्र",
    "ui.rpi": "जोखिम सूचकांक (RPI)",
    "ui.before": "मरम्मत से पहले",
    "ui.after": "मरम्मत के बाद",
    "ui.contractor": "ठेकेदार एजेंसी",
    "ui.autoCloseNotice": "बस सेंसर जांच द्वारा स्वतः सत्यापित व बंद",
    "ui.submitReport": "गड्ढे की शिकायत दर्ज करें",
    "ui.camera": "कैमरा फ़ीड",
    "ui.uploadPhoto": "फोटो अपलोड करें",
    "ui.location": "सड़क का स्थान",
    "ui.description": "विवरण",
    "ui.ticketGenerated": "शिकायत टिकट सफलतापूर्वक तैयार",
    "ui.autoVerify": "मरम्मत हुए गड्ढों को स्वतः सत्यापित व बंद करें",
    "ui.jalBoardAlert": "IS:1726 जल बोर्ड आपातकालीन अलर्ट",
    "ui.debarmentLedger": "ठेकेदार प्रतिबंध सूची (GeM)",
    "ui.asphaltQC": "डामर तापमान व गुणवत्ता ऑडिट",

    // Incidents & Police Dispatch
    "incidents.title": "सड़क सुरक्षा घटनाएं एवं बहु-एजेंसी प्रवर्तन",
    "incidents.subtitle": "एमटीसी बस टेलीमेट्री, जीपीएस और एएनपीआर के साथ वास्तविक समय एआई पहचान।",
    "incidents.pcrDispatch": "112 पुलिस नियंत्रण कक्ष को भेजें",
    "incidents.pcrSent": "पुलिस सिग्नल भेजा गया",
    "incidents.multiBusSightings": "मल्टी-बस एएनपीआर ट्रैकिंग रिंग",
    "incidents.generateSummons": "कानूनी समन जारी करें",
    "incidents.slaTimer": "एसएलए समाधान समय",

    // Fleet Telemetry
    "fleet.title": "बस बेड़ा टेलीमेट्री एवं मोबाइल डैशकैम इनपुट",
    "fleet.liveFeed": "लाइव वीडियो फ़ीड",
    "fleet.imuSensors": "5Hz आईएमयू एक्सेलेरोमीटर",
    "fleet.gpsLocation": "AIS-140 जीपीएस टेलीमेट्री",
    "fleet.aiRadio": "एआई वॉयस डिस्पैचर",
    "fleet.takeSnapshot": "स्नैपशॉट लें",
    "fleet.speed": "गति",
    "fleet.vibration": "कंपन",

    // Autonomous Lifecycle & Auto-Verification
    "lifecycle.title": "स्वतः गड्ढा पहचान से स्वतः समाधान चक्र",
    "lifecycle.subtitle": "एआई कैमरा पहचान -> स्वतः केस पंजीकरण -> मरम्मत -> बस पुनः जांच द्वारा स्वतः बंद",
    "lifecycle.runDrill": "स्वतः पहचान व स्वतः बंद सिमुलेशन चलाएं",
    "lifecycle.runningDrill": "स्वतः चक्र सिमुलेशन प्रगति पर है...",
    "lifecycle.autoDetected": "बस सेंसर द्वारा स्वतः पहचाना गया",
    "lifecycle.autoVerified": "बस पुनः जांच द्वारा स्वतः सत्यापित व बंद",
    "lifecycle.step1": "1. एज कैमरा एवं IMU शॉक सेंसर द्वारा गड्ढा पहचान",
    "lifecycle.step2": "2. शिकायत केस स्वतः दर्ज एवं समय सीमा तय",
    "lifecycle.step3": "3. ठेकेदार द्वारा डामर मरम्मत पूर्ण",
    "lifecycle.step4": "4. गश्त कर रही बस द्वारा पुनः जांच एवं स्वतः समाधान (Gz < 1.05g)",
    "lifecycle.successNotice": "सड़क का गड्ढा बस की पुनः जांच द्वारा स्वतः सत्यापित व बंद कर दिया गया!",

    // Analytics
    "analytics.title": "नगरपालिका इंफ्रास्ट्रक्चर विश्लेषण एवं सड़क क्षरण",
    "analytics.monsoonInundation": "मानसून जलभराव एवं सूक्ष्म-ऊंचाई रडार",
    "analytics.pciForecast": "6 महीने का सड़क गुणवत्ता (PCI) पूर्वानुमान",
    "analytics.contractorDebarment": "ठेकेदार एस्क्रो एवं डिबारमेंट जोखिम"
  },
  ta: {
    // Navigation & Layout
    "nav.command": "கட்டுப்பாட்டு மையம்",
    "nav.incidents": "சம்பவங்கள் & அமலாக்கம்",
    "nav.memory": "சாலை நுண்ணறிவு",
    "nav.analytics": "பகுப்பாய்வு & அறிக்கைகள்",
    "nav.fleet": "பேருந்து தொலைஅளவியல்",
    "nav.workOrders": "பணி ஆணைகள் & 3D",
    "nav.capture": "டாஷ்கேம் உள்ளீடு",
    "nav.reportIssue": "புகார் பதிவு செய்",
    "nav.search": "தேடு",
    "nav.live": "நேரலை",
    "nav.demo": "டெமோ முறை",
    "nav.jurisdiction": "அதிகார வரம்பு",
    "nav.authorized": "அங்கீகரிக்கப்பட்டது",
    "nav.views": "பிரிவுகள்",

    // Header & Tools
    "header.title": "ரோட்சாரதி",
    "header.subtitle": "சென்னை சாலை நுண்ணறிவு",
    "header.searchPlaceholder": "பேருந்துகள், சாலைகள், விபத்துகளைத் தேடுக... (Ctrl+K)",
    "header.tools": "கருவிகள்",
    "header.toolsTitle": "நிர்வாகக் கருவிகள் & செயல்கள்",
    "header.whatIf": "சாத்தியக்கூறு மாதிரி ஆய்வு",
    "header.whatIfSub": "சாலை பழுதுபார்த்தல் சிமுலேஷன்",
    "header.aiWeights": "AI மாதிரிகள் & ஸ்ட்ரீம்கள்",
    "header.aiWeightsSub": "வன்பொருள் இல்லாத RTSP & .pt மாதிரிகள்",
    "header.sensorFusion": "சென்சார் இணைப்பு (<45ms)",
    "header.sensorFusionSub": "AIS-140 & RTSP வன்பொருள் இல்லாத என்ஜின்",
    "header.pdfSummons": "1-கிளிக் சட்டப்பூர்வ சம்மன்",
    "header.pdfSummonsSub": "ஒப்பந்ததாரர் அபராத நோட்டீஸ்",
    "header.soundAlerts": "ஒலி எச்சரிக்கைகள்",
    "header.shortcuts": "விசைப்பலகை குறுக்குவழிகள்",
    "header.notifications": "அறிவிப்புகள்",
    "header.switchRole": "அதிகாரி பொறுப்பை மாற்றுக",
    "header.signOut": "வெளியேறு",
    "header.activeSession": "செயலில் உள்ள அமர்வு",

    // KPIs & Metrics
    "kpi.activeBuses": "இயங்கும் பேருந்துகள்",
    "kpi.roadHazards": "சாலை அபாயங்கள்",
    "kpi.waterlogging": "மழைநீர் தேக்கம்",
    "kpi.congestionZones": "நெரிசல் பகுதிகள்",
    "kpi.workOrders": "பணி ஆணைகள்",
    "kpi.nodes": "முனையங்கள்",

    // Defects & Hazards
    "defect.pothole": "சாலை குழி / பள்ளம்",
    "defect.alligator": "முதலை தோல் விரிசல்",
    "defect.transverse": "குறுக்கு விரிசல்",
    "defect.linear": "நீள விரிசல்",
    "defect.waterlog": "மழைநீர் தேக்கம்",
    "defect.zebra": "பாதசாரி கடக்கும் கோடு",
    "defect.fadedZebra": "மங்கிய பாதசாரி கோடு",
    "defect.unmarkedHump": "குறிக்கப்படாத வேகத்தடை",
    "defect.illegalHump": "அனுமதியற்ற வேகத்தடை",
    "defect.darkSpot": "விளக்கற்ற இருண்ட பகுதி",
    "defect.openManhole": "திறந்த கழிவுநீர் தொட்டி",
    "defect.sunkenTrench": "தாழ்ந்த பயன்பாட்டு குழி",
    "defect.submergedPothole": "நீரில் மூழ்கிய மறைந்த குழி",
    "defect.foliageSign": "மரங்களால் மறைக்கப்பட்ட பலகை",
    "defect.bannerSign": "விளம்பரத்தால் மறைக்கப்பட்ட பலகை",
    "defect.criticalPotholes": "அபாயகரமான குழிகள்",
    "defect.hitAndRun": "மோதிவிட்டு தப்பிய வாகனம் (Hit & Run)",
    "defect.congestion": "கடுமையான போக்குவரத்து நெரிசல்",

    // Severities
    "sev.critical": "மிகவும் அவசரம்",
    "sev.high": "அதி முக்கியம்",
    "sev.medium": "நடுத்தரம்",
    "sev.low": "குறைந்த அளவு",

    // Statuses
    "status.open": "திறந்த நிலை",
    "status.assigned": "ஒதுக்கப்பட்டது",
    "status.under_repair": "பழுதுபார்க்கப்படுகிறது",
    "status.resolved": "தீர்க்கப்பட்டது",
    "status.verified_closed": "சரிபார்க்கப்பட்டு மூடப்பட்டது",

    // UI & Action Buttons
    "ui.filter": "வடிகட்டு",
    "ui.export": "ஏற்றுமதி செய்",
    "ui.refresh": "புதுப்பி",
    "ui.inspect": "ஆய்வு செய்",
    "ui.evidence": "ஆதாரங்கள் மற்றும் தரவுகள்",
    "ui.dispatch": "படைப்பிரிவை அனுப்புக",
    "ui.close": "மூடு",
    "ui.submit": "சமர்ப்பி",
    "ui.moRTH": "மத்திய சாலை போக்குவரத்து தரநிலை (MoRTH)",
    "ui.slaActive": "24 மணி நேர SLA செயலில் உள்ளது",
    "ui.passes": "பேருந்து ஆய்வு சுற்றுகள்",
    "ui.rpi": "ஆபத்து குறியீடு (RPI)",
    "ui.before": "பழுதுபார்க்கும் முன்",
    "ui.after": "பழுதுபார்த்த பின்",
    "ui.contractor": "ஒப்பந்த நிறுவனம்",
    "ui.autoCloseNotice": "பேருந்து சென்சார் மூலம் தானாக சரிபார்க்கப்பட்டு மூடப்பட்டது",
    "ui.submitReport": "குழி பற்றி புகார் அளிக்கவும்",
    "ui.camera": "கேமரா காட்சி",
    "ui.uploadPhoto": "புகைப்படம் பதிவேற்றவும்",
    "ui.location": "சாலை இருப்பிடம்",
    "ui.description": "விளக்கம்",
    "ui.ticketGenerated": "புகார் வெற்றிகரமாக உருவாக்கப்பட்டது",
    "ui.autoVerify": "சரிசெய்யப்பட்ட குழிகளை தானாக மூடுக",
    "ui.jalBoardAlert": "IS:1726 குடிநீர் வடிகால் வாரிய அவசர எச்சரிக்கை",
    "ui.debarmentLedger": "ஒப்பந்ததாரர் தடை பட்டியல் (GeM)",
    "ui.asphaltQC": "தார் வெப்பநிலை & தர தணிக்கை",

    // Incidents & Police Dispatch
    "incidents.title": "சாலை பாதுகாப்பு சம்பவங்கள் & பல்துறை அமலாக்கம்",
    "incidents.subtitle": "MTC பேருந்து சென்சார்கள், GPS மற்றும் ANPR கேமராக்கள் மூலம் நேரடி AI கண்டறிதல்.",
    "incidents.pcrDispatch": "112 காவல் துறைக்கு தகவல் அனுப்பு",
    "incidents.pcrSent": "காவல்துறைக்கு தகவல் அனுப்பப்பட்டது",
    "incidents.multiBusSightings": "பல பேருந்து ANPR கண்காணிப்பு பிணையம்",
    "incidents.generateSummons": "சட்டப்பூர்வ சம்மன் உருவாக்கு",
    "incidents.slaTimer": "SLA தீர்வு நேரம்",

    // Fleet Telemetry
    "fleet.title": "பேருந்து தொலைஅளவியல் & டாஷ்கேம் தகவல்",
    "fleet.liveFeed": "நேரலை வீடியோ காட்சி",
    "fleet.imuSensors": "5Hz IMU முடுக்கமானி",
    "fleet.gpsLocation": "AIS-140 ஜிபிஎஸ் தகவல்",
    "fleet.aiRadio": "AI குரல் தகவல் தொடர்பாளர்",
    "fleet.takeSnapshot": "புகைப்படம் எடு",
    "fleet.speed": "வேகம்",
    "fleet.vibration": "அதிர்வு",

    // Autonomous Lifecycle & Auto-Verification
    "lifecycle.title": "தானியங்கி சாலை குழி கண்டறிதல் & மூடல் சுழற்சி",
    "lifecycle.subtitle": "AI கேமரா கண்டறிதல் -> தானியங்கி வழக்கு பதிவு -> பழுதுபார்ப்பு -> பேருந்து மறுஆய்வு மூலம் தானியங்கி மூடல்",
    "lifecycle.runDrill": "தானியங்கி கண்டறிதல் & மறுஆய்வு மூடல் சோதனை",
    "lifecycle.runningDrill": "தானியங்கி சோதனை இயங்குகிறது...",
    "lifecycle.autoDetected": "பேருந்து AI மூலம் தானாக கண்டறியப்பட்டது",
    "lifecycle.autoVerified": "பேருந்து மறுஆய்வு மூலம் தானாக சரிபார்க்கப்பட்டு மூடப்பட்டது",
    "lifecycle.step1": "1. AI கேமரா மற்றும் IMU அதிர்வு மூலம் குழி கண்டறிதல்",
    "lifecycle.step2": "2. பணி ஆணை தானாக உருவாக்கப்பட்டு SLA தொடக்கம்",
    "lifecycle.step3": "3. ஒப்பந்ததாரர் தார் மூலம் குழியை சரிசெய்தல்",
    "lifecycle.step4": "4. ரோந்து பேருந்து மறுஆய்வு செய்து வழக்கை தானாக மூடுதல் (Gz < 1.05g)",
    "lifecycle.successNotice": "பேருந்து மறுஆய்வு மூலம் சாலை குழி வெற்றிகரமாக சரிபார்க்கப்பட்டு மூடப்பட்டது!",

    // Analytics
    "analytics.title": "நகராட்சி உள்கட்டமைப்பு பகுப்பாய்வு & சாலை தேய்மானம்",
    "analytics.monsoonInundation": "பருவமழை நீர் தேக்கம் & உயர ரேடார்",
    "analytics.pciForecast": "6 மாத சாலை தரம் (PCI) முன்னறிவிப்பு",
    "analytics.contractorDebarment": "ஒப்பந்ததாரர் அபராதம் & தடை அபாயம்"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('roadsaarthi_lang');
    return (saved === 'hi' || saved === 'en' || saved === 'ta') ? (saved as Language) : 'en';
  });

  useEffect(() => {
    localStorage.setItem('roadsaarthi_lang', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => {
      if (prev === 'en') return 'hi';
      if (prev === 'hi') return 'ta';
      return 'en';
    });
  };

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || TRANSLATIONS['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
