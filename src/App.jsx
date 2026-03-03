import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  Camera, 
  Search, 
  Settings, 
  UserPlus, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  History,
  ShieldCheck,
  LogOut,
  Loader2,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Lock,
  Mail
} from 'lucide-react';

// External script loader for face-api.js
const FACE_API_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";

const AuthView = ({
  authMode,
  setAuthMode,
  name,
  setName,
  college,
  setCollege,
  email,
  setEmail,
  password,
  setPassword,
  handleSignup,
  handleLogin
}) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
      <div className="text-center mb-8">
        <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">Campus Guard</h1>
        <p className="text-slate-400 mt-2">
          {authMode === 'signup' ? 'Sign up for your institution' : 'Welcome back, please login'}
        </p>
      </div>

      <div className="space-y-4">
        {authMode === 'signup' && (
          <>
            <div className="relative">
              <Users className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full bg-slate-700 text-white p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 text-slate-500" size={18} />
              <input
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="College/Institution Name"
                required
                className="w-full bg-slate-700 text-white p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-slate-700 text-white p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            className="w-full bg-slate-700 text-white p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {authMode === 'signup' ? (
          <button
            onClick={handleSignup}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            type="button"
          >
            Create Account
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            type="button"
          >
            Login Now
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
          className="text-slate-400 hover:text-indigo-400 text-sm font-medium transition-colors"
          type="button"
        >
          {authMode === 'signup' ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  </div>
);

const App = () => {
  // --- State Management ---
  const [view, setView] = useState('auth'); // auth, dashboard, monitor, search, attendance
  const [authMode, setAuthMode] = useState('signup'); // signup, login
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [showParametersInLive, setShowParametersInLive] = useState(true);
  const [activeParameters, setActiveParameters] = useState(['Roll No']);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [college, setCollege] = useState("");
  
  const monitorRef = useRef({ lastDetection: {}, isProcessing: false });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMatcherRef = useRef(null);
  const loopActiveRef = useRef(false);

  // --- Initialization ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = FACE_API_URL;
    script.async = true;
    script.onload = async () => {
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsApiLoaded(true);
      } catch (err) {
        console.error("Model loading failed", err);
      }
    };
    document.head.appendChild(script);

    const savedStudents = localStorage.getItem('campus_students');
    if (savedStudents) setStudents(JSON.parse(savedStudents));
    
    const savedHistory = localStorage.getItem('campus_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedAttendance = localStorage.getItem('campus_attendance');
    if (savedAttendance) setAttendanceSessions(JSON.parse(savedAttendance));
  }, []);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    if (u) {
      // Load saved local profile (created at signup)
      const profile = JSON.parse(localStorage.getItem(`user_${u.email}`));
      if (profile) {
        setUser({ name: profile.name, email: u.email, college: profile.college });
      } else {
        setUser({ email: u.email });
      }
      setView('dashboard');
    } else {
      setUser(null);
      setView('auth');
    }
  });

  return () => unsubscribe();
}, []);

  useEffect(() => {
    if (isApiLoaded && students.length > 0) {
      updateFaceMatcher();
    }
  }, [students, isApiLoaded]);

  const updateFaceMatcher = async () => {
    const labeledDescriptors = await Promise.all(
      students.map(async (student) => {
        if (!student.descriptors) return null;
        const descriptors = student.descriptors.map(d => new Float32Array(Object.values(d)));
        return new faceapi.LabeledFaceDescriptors(student.id, descriptors);
      })
    );
    const validDescriptors = labeledDescriptors.filter(d => d !== null);
    if (validDescriptors.length > 0) {
      faceMatcherRef.current = new faceapi.FaceMatcher(validDescriptors, 0.6);
    }
  };

  const logActivity = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const now = new Date();
    const lastLog = monitorRef.current.lastDetection[studentId];
    if (!lastLog || (now - new Date(lastLog)) > 30000) {
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        studentId,
        studentName: student.name,
        timestamp: now.toISOString(),
        params: student.params
      };
      setHistory(prev => {
        const updated = [newEntry, ...prev];
        localStorage.setItem('campus_history', JSON.stringify(updated));
        return updated;
      });
      monitorRef.current.lastDetection[studentId] = now.toISOString();
    }

    if (activeSession) {
      const nowTime = new Date();
      const startTime = new Date(`${activeSession.date}T${activeSession.startTime}`);
      const endTime = new Date(`${activeSession.date}T${activeSession.endTime}`);
      
      if (nowTime >= startTime && nowTime <= endTime) {
        setAttendanceSessions(prev => {
          const updated = prev.map(session => {
            if (session.id === activeSession.id) {
              const studentInList = session.list.find(item => item.studentId === studentId);
              if (studentInList && studentInList.status === 'Absent') {
                return {
                  ...session,
                  list: session.list.map(item => 
                    item.studentId === studentId ? { ...item, status: 'Present', arrivalTime: nowTime.toLocaleTimeString() } : item
                  )
                };
              }
            }
            return session;
          });
          localStorage.setItem('campus_attendance', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

 

  const addStudent = async (studentData) => {
    const newStudent = {
      id: Math.random().toString(36).substr(2, 9),
      ...studentData,
      registeredAt: new Date().toISOString()
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    localStorage.setItem('campus_students', JSON.stringify(updated));
  };

  // --- Firebase auth handlers (top-level in App component) ---
const handleSignup = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const u = userCredential.user;
    // save a simple profile locally (you can move this to Firestore later)
    localStorage.setItem(`user_${u.email}`, JSON.stringify({
      name: name || "Unnamed",
      college: college || ""
    }));
    alert("Account created successfully 🎉");
  } catch (err) {
    alert(err.message || "Signup failed");
  }
};

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful 🚀");
    // onAuthStateChanged will update UI
  } catch (err) {
    alert(err.message || "Login failed");
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    setUser(null);
    setView('auth');
  } catch (err) {
    console.error("Logout failed", err);
  }
};

  

  const Dashboard = () => {
    const [isAdding, setIsAdding] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [tempParams, setTempParams] = useState([{ key: 'Roll No', value: '' }, { key: 'Branch', value: '' }]);
    const [isProcessingFace, setIsProcessingFace] = useState(false);
    const [useUpload, setUseUpload] = useState(false);
    const addVideoRef = useRef(null);
    const fileInputRef = useRef(null);

    const startEnrollmentCamera = async () => {
      if (useUpload) return;
      setCapturedImage(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (addVideoRef.current) addVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    const stopCamera = () => {
      if (addVideoRef.current && addVideoRef.current.srcObject) {
        const stream = addVideoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        addVideoRef.current.srcObject = null;
      }
    };

    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsProcessingFace(true);
      try {
        const img = await faceapi.bufferToImage(file);
        const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          setCapturedImage({ url: canvas.toDataURL('image/jpeg'), descriptors: [Array.from(detections.descriptor)] });
        } else {
          alert("No face detected in the uploaded image!");
        }
      } catch (err) {
        console.error("File processing error:", err);
        alert("Error processing image file.");
      }
      setIsProcessingFace(false);
    };

    const captureFace = async () => {
      if (!addVideoRef.current) return;
      setIsProcessingFace(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = addVideoRef.current.videoWidth;
        canvas.height = addVideoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(addVideoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const detections = await faceapi.detectSingleFace(addVideoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          setCapturedImage({ url: dataUrl, descriptors: [Array.from(detections.descriptor)] });
          stopCamera();
        } else {
          alert("No face detected!");
        }
      } catch (e) { console.error(e); }
      setIsProcessingFace(false);
    };

    const saveStudent = (e) => {
      e.preventDefault();
      if (!capturedImage) return alert("Face data required (Capture or Upload)");
      const params = {};
      tempParams.forEach(p => { if (p.key) params[p.key] = p.value });
      addStudent({ name: e.target.studentName.value, params, descriptors: capturedImage.descriptors, photo: capturedImage.url });
      setIsAdding(false);
      stopCamera();
    };

    

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-white">Student Directory</h2><p className="text-slate-400">{students.length} students enrolled</p></div>
          <button onClick={() => { setIsAdding(true); setUseUpload(false); setTimeout(startEnrollmentCamera, 100); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"><UserPlus size={20} /> Add Student</button>
        </div>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-2xl rounded-2xl p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6">Enroll New Student</h3>
              
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => { setUseUpload(false); setCapturedImage(null); setTimeout(startEnrollmentCamera, 100); }} 
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${!useUpload ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  <Camera size={14} className="inline mr-2" /> Live Camera
                </button>
                <button 
                  onClick={() => { setUseUpload(true); stopCamera(); setCapturedImage(null); }} 
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${useUpload ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  <Upload size={14} className="inline mr-2" /> Upload Photo
                </button>
              </div>

              <form onSubmit={saveStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {!capturedImage ? (
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center border border-slate-700">
                        {useUpload ? (
                          <div className="text-center p-4">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                            {isProcessingFace ? (
                              <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mb-2" />
                            ) : (
                              <Upload className="text-slate-600 w-12 h-12 mb-2 mx-auto" />
                            )}
                            <p className="text-slate-400 text-xs mb-4">Select a clear portrait photo</p>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-xs">Choose File</button>
                          </div>
                        ) : (
                          <>
                            <video ref={addVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            <button type="button" onClick={captureFace} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2">
                              {isProcessingFace ? <Loader2 className="animate-spin" /> : <Camera size={18} />} Capture
                            </button>
                          </>
                        )}
                      </div>
                    ) : ( 
                      <div className="relative">
                        <img src={capturedImage.url} className="w-full aspect-video object-cover rounded-lg border-2 border-indigo-500" />
                        <button type="button" onClick={() => {setCapturedImage(null); if(!useUpload) startEnrollmentCamera();}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <input name="studentName" placeholder="Student Name" required className="w-full bg-slate-700 text-white p-3 rounded-lg border border-slate-600" />
                    {tempParams.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={p.key} onChange={e => { const n = [...tempParams]; n[i].key = e.target.value; setTempParams(n); }} className="w-1/3 bg-slate-700 p-2 rounded text-white text-xs" placeholder="Key" />
                        <input value={p.value} onChange={e => { const n = [...tempParams]; n[i].value = e.target.value; setTempParams(n); }} className="flex-1 bg-slate-700 p-2 rounded text-white text-xs" placeholder="Value" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setTempParams([...tempParams, { key: '', value: '' }])} className="text-indigo-400 text-xs">+ Field</button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700"><button type="button" onClick={() => {setIsAdding(false); stopCamera();}} className="px-6 py-2 text-slate-400">Cancel</button><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Enroll Student</button></div>
              </form>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map(student => (
            <div key={student.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group">
              <div className="h-48 relative"><img src={student.photo} className="w-full h-full object-cover" /><div className="absolute bottom-0 p-4 bg-gradient-to-t from-slate-900 w-full"><h4 className="font-bold text-white">{student.name}</h4></div></div>
              <div className="p-4 space-y-2">{Object.entries(student.params).map(([k, v]) => (<div key={k} className="flex justify-between text-xs"><span className="text-slate-500">{k}:</span><span className="text-slate-200">{v}</span></div>))}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AttendanceView = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterRollStart, setFilterRollStart] = useState('');
    const [filterRollEnd, setFilterRollEnd] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [sessionTitle, setSessionTitle] = useState('');
    const [viewingSession, setViewingSession] = useState(null);

    const branches = Array.from(new Set(students.map(s => s.params['Branch']).filter(Boolean)));

    const createSession = () => {
      if (!sessionTitle) return alert("Enter session title");
      
      const filtered = students.filter(s => {
        const branchMatch = filterBranch === 'All' || s.params['Branch'] === filterBranch;
        const rollNo = parseInt(s.params['Roll No']);
        const rollMatch = (!filterRollStart || rollNo >= parseInt(filterRollStart)) && 
                          (!filterRollEnd || rollNo <= parseInt(filterRollEnd));
        return branchMatch && rollMatch;
      });

      if (filtered.length === 0) return alert("No students match your filters");

      const newSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: sessionTitle,
        date: selectedDate,
        startTime,
        endTime,
        list: filtered.map(s => ({
          studentId: s.id,
          name: s.name,
          rollNo: s.params['Roll No'],
          branch: s.params['Branch'],
          status: 'Absent',
          arrivalTime: null
        }))
      };

      const updated = [newSession, ...attendanceSessions];
      setAttendanceSessions(updated);
      localStorage.setItem('campus_attendance', JSON.stringify(updated));
      setIsCreating(false);
    };

    const getSessionStatus = (session) => {
      const now = new Date();
      const start = new Date(`${session.date}T${session.startTime}`);
      const end = new Date(`${session.date}T${session.endTime}`);
      if (now < start) return 'Upcoming';
      if (now > end) return 'Ended';
      return 'Ongoing';
    };
    // Firebase signup


// Firebase login


    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-white">Attendance Management</h2><p className="text-slate-400">Schedule sessions and track presence</p></div>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"><Plus size={20} /> New Session</button>
        </div>

        {isCreating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-2xl rounded-2xl p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-6">Schedule New Session</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Session Name</label>
                  <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="e.g. Morning Lecture - CS101" className="w-full bg-slate-700 p-3 mt-1 rounded-lg text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-slate-700 p-3 mt-1 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-700 p-3 mt-1 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-700 p-3 mt-1 rounded-lg text-white" />
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter size={14}/> Student Filter</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Branch</label>
                      <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="w-full bg-slate-700 p-2 mt-1 rounded text-sm text-white outline-none">
                        <option value="All">All Branches</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Roll No From</label>
                      <input value={filterRollStart} onChange={e => setFilterRollStart(e.target.value)} placeholder="00" className="w-full bg-slate-700 p-2 mt-1 rounded text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Roll No To</label>
                      <input value={filterRollEnd} onChange={e => setFilterRollEnd(e.target.value)} placeholder="99" className="w-full bg-slate-700 p-2 mt-1 rounded text-sm text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button onClick={() => setIsCreating(false)} className="px-6 py-2 text-slate-400">Cancel</button>
                  <button onClick={createSession} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Create List</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewingSession && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-4xl rounded-2xl p-6 border border-slate-700 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{viewingSession.title}</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-2 mt-1"><Calendar size={14}/> {viewingSession.date} | <Clock size={14}/> {viewingSession.startTime} - {viewingSession.endTime}</p>
                </div>
                <button onClick={() => setViewingSession(null)} className="text-slate-400 hover:text-white">Close</button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
                  <div className="text-indigo-400 text-2xl font-black">{viewingSession.list.length}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Total</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
                  <div className="text-emerald-500 text-2xl font-black">{viewingSession.list.filter(l => l.status === 'Present').length}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Present</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
                  <div className="text-red-500 text-2xl font-black">{viewingSession.list.filter(l => l.status === 'Absent').length}</div>
                  <div className="text-xs text-slate-500 font-bold uppercase">Absent</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl border border-slate-700 shadow-inner">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900"><tr className="text-xs font-black text-slate-500 uppercase tracking-widest"><th className="p-4">Student Name</th><th className="p-4">Roll / Branch</th><th className="p-4">Arrival</th><th className="p-4">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">
                    {viewingSession.list.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-4 font-bold text-white">{item.name}</td>
                        <td className="p-4 text-xs text-slate-400">{item.rollNo} / {item.branch}</td>
                        <td className="p-4 text-xs text-indigo-400 font-mono">{item.arrivalTime || '--:--'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${item.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attendanceSessions.map(session => {
            const status = getSessionStatus(session);
            const presentCount = session.list.filter(l => l.status === 'Present').length;
            const totalCount = session.list.length;
            return (
              <div key={session.id} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    status === 'Ongoing' ? 'bg-indigo-500 text-white animate-pulse' : 
                    status === 'Upcoming' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'
                  }`}>{status}</span>
                  <button onClick={() => {
                    const updated = attendanceSessions.filter(s => s.id !== session.id);
                    setAttendanceSessions(updated);
                    localStorage.setItem('campus_attendance', JSON.stringify(updated));
                  }} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{session.title}</h3>
                <div className="text-xs text-slate-500 mb-6 flex flex-col gap-1">
                  <span className="flex items-center gap-2"><Calendar size={12}/> {session.date}</span>
                  <span className="flex items-center gap-2"><Clock size={12}/> {session.startTime} - {session.endTime}</span>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400">Completion</span>
                    <span className="text-white">{Math.round((presentCount/totalCount)*100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${(presentCount/totalCount)*100}%` }}></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewingSession(session)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700">View Logs</button>
                  {status === 'Ongoing' && (
                    <button onClick={() => { setView('monitor'); setActiveSession(session); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500">Live Track</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const MonitorView = () => {
    const frameId = useRef(null);
    const [streamError, setStreamError] = useState(null);

    const runDetectionLoop = async () => {
      if (!loopActiveRef.current || !videoRef.current || !canvasRef.current || !isApiLoaded) return;
      const currentVideo = videoRef.current;
      const currentCanvas = canvasRef.current;
      if (currentVideo.paused || currentVideo.ended || currentVideo.readyState < 2) {
        frameId.current = requestAnimationFrame(runDetectionLoop);
        return;
      }
      try {
        const detections = await faceapi.detectAllFaces(currentVideo, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        const width = currentVideo.offsetWidth;
        const height = currentVideo.offsetHeight;
        if (width > 0 && height > 0) {
          currentCanvas.width = width;
          currentCanvas.height = height;
          const resizedDetections = faceapi.resizeResults(detections, { width, height });
          const ctx = currentCanvas.getContext('2d');
          ctx.clearRect(0, 0, width, height);

          resizedDetections.forEach(d => {
            let student = null;
            if (faceMatcherRef.current) {
              const match = faceMatcherRef.current.findBestMatch(d.descriptor);
              if (match.label !== 'unknown') {
                student = students.find(s => s.id === match.label);
                logActivity(match.label);
              }
            }
            const { x, y, width: bW, height: bH } = d.detection.box;
            
            ctx.strokeStyle = student ? '#6366f1' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, bW, bH);

            if (student && showParametersInLive) {
              const displayInfo = activeParameters.map(k => student.params[k]).filter(v => v).join(' | ');
              const labelHeight = displayInfo ? 45 : 25;
              const boxX = x;
              const boxY = y - labelHeight - 5;

              ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
              ctx.fillRect(boxX, boxY, bW, labelHeight);
              
              ctx.save();
              ctx.translate(boxX + bW / 2, boxY + labelHeight / 2);
              ctx.scale(-1, 1);
              ctx.translate(-(boxX + bW / 2), -(boxY + labelHeight / 2));

              ctx.fillStyle = 'white';
              ctx.font = 'bold 14px Inter';
              ctx.fillText(student.name, boxX + 8, boxY + 18);
              
              if (displayInfo) {
                ctx.fillStyle = '#818cf8';
                ctx.font = '500 11px Inter';
                ctx.fillText(displayInfo, boxX + 8, boxY + 36);
              }
              ctx.restore();
            }
          });
        }
      } catch (err) { console.error(err); }
      frameId.current = requestAnimationFrame(runDetectionLoop);
    };

    useEffect(() => {
      let currentStream = null;
      loopActiveRef.current = true;
      const startMonitor = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } });
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
            videoRef.current.onloadedmetadata = () => { videoRef.current.play(); runDetectionLoop(); };
          }
        } catch (err) { setStreamError(err.message); }
      };
      startMonitor();
      return () => {
        loopActiveRef.current = false;
        if (frameId.current) cancelAnimationFrame(frameId.current);
        if (currentStream) currentStream.getTracks().forEach(t => t.stop());
      };
    }, []);

    const allAvailableParams = Array.from(new Set(students.flatMap(s => Object.keys(s.params))));

    return (
      <div className="p-6">
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-3"><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>Surveillance Active</h2>
                {activeSession && <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">Tracking Attendance: {activeSession.title}</p>}
              </div>
              <button onClick={() => setShowParametersInLive(!showParametersInLive)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${showParametersInLive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{showParametersInLive ? <Eye size={16} /> : <EyeOff size={16} />} {showParametersInLive ? 'Labels On' : 'Labels Off'}</button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video border border-slate-800 shadow-2xl">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none mirror" style={{ transform: 'scaleX(-1)' }} />
              {!isCameraActive && !streamError && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4"><Loader2 className="animate-spin text-indigo-500" /></div>}
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Metadata Overlay Selection</p>
              <div className="flex flex-wrap gap-2">
                {allAvailableParams.map(p => (
                  <button key={p} onClick={() => setActiveParameters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${activeParameters.includes(p) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full xl:w-96 space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2 tracking-tight"><History size={18} className="text-indigo-500" /> {activeSession ? 'Live Attendance' : 'History'}</h3>
              {activeSession && <button onClick={() => setActiveSession(null)} className="text-[10px] text-red-400 font-bold hover:underline">Exit Live</button>}
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {activeSession ? (
                attendanceSessions.find(s => s.id === activeSession.id).list
                  .sort((a, b) => (a.status === 'Present' ? -1 : 1))
                  .map((log, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all ${log.status === 'Present' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-white font-bold block text-sm">{log.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{log.rollNo} • {log.branch}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-black ${log.status === 'Present' ? 'text-emerald-500' : 'text-slate-600'}`}>{log.status.toUpperCase()}</span>
                          {log.arrivalTime && <span className="text-[10px] text-indigo-400">{log.arrivalTime}</span>}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                history.length === 0 ? <div className="text-center py-10 text-slate-600 text-sm italic">Waiting...</div> : history.slice(0, 20).map(entry => (
                  <div key={entry.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 border-l-4 border-l-indigo-500 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-start"><div><span className="text-white font-bold block">{entry.studentName}</span><span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{Object.values(entry.params).join(' • ')}</span></div><span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded">{new Date(entry.timestamp).toLocaleTimeString()}</span></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SearchView = () => {
    const [query, setQuery] = useState('');
    const filteredHistory = history.filter(h => {
      const s = query.toLowerCase();
      return h.studentName.toLowerCase().includes(s) || Object.values(h.params).some(v => String(v).toLowerCase().includes(s));
    });
    return (
      <div className="p-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-6"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search activity logs..." className="w-full bg-slate-950 text-white pl-12 pr-4 py-4 rounded-xl outline-none border border-slate-800 focus:border-indigo-500 transition-all shadow-inner" /></div></div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-950"><tr><th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Student</th><th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Metadata</th><th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Timestamp</th><th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredHistory.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4"><div className="font-bold text-slate-100">{log.studentName}</div></td>
                  <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{Object.entries(log.params).map(([k, v]) => (<span key={k} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{v}</span>))}</div></td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4"><span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/20">VERIFIED</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (view === 'auth') {
  return (
    <AuthView
      key="auth"
      authMode={authMode}
      setAuthMode={setAuthMode}
      name={name}
      setName={setName}
      college={college}
      setCollege={setCollege}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleSignup={handleSignup}
      handleLogin={handleLogin}
    />
  );
}

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      <nav className="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-auto md:min-h-screen">
        <div className="p-8 flex items-center gap-4 border-b border-slate-800/50"><ShieldCheck size={32} className="text-indigo-500" /><h1 className="font-black text-white italic text-xl tracking-tighter">AI-GUARD</h1></div>
        <div className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800'}`}><Users size={20} /> Database</button>
          <button onClick={() => setView('attendance')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${view === 'attendance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800'}`}><Calendar size={20} /> Attendance</button>
          <button onClick={() => setView('monitor')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${view === 'monitor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800'}`}><Camera size={20} /> Surveillance</button>
          <button onClick={() => setView('search')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${view === 'search' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-800'}`}><History size={20} /> Activity Logs</button>
        </div>
        <div className="p-6 border-t border-slate-800/50"><button onClick={handleLogout} className="w-full text-slate-600 flex items-center justify-center gap-2 font-bold text-xs uppercase hover:text-red-400 transition-colors">
  <LogOut size={16} /> Logout
</button></div>
      </nav>
      <main className="flex-1 overflow-y-auto">
        <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-900 px-8 py-5 flex justify-between items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{view}</h2>
          <div className="flex items-center gap-6">
            {user && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{user.college}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isApiLoaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isApiLoaded ? 'System Online' : 'Warming Up...'}</span>
            </div>
          </div>
        </header>
        {view === 'dashboard' && <Dashboard />}
        {view === 'attendance' && <AttendanceView />}
        {view === 'monitor' && <MonitorView />}
        {view === 'search' && <SearchView />}
      </main>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; background: #020617; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
};

export default App;