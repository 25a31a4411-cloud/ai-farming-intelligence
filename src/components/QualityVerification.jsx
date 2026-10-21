import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Camera, MapPin, RotateCcw, ShieldAlert, X } from "lucide-react";
import { createId } from "../data/prototypeData";
import { deleteAssessmentPhoto, saveAssessmentPhoto } from "../data/qualityAssessmentStorage";

const MAX_GPS_ACCURACY_METERS = 100;
const MAX_GPS_AGE_MILLISECONDS = 60_000;

const text = {
  en: {
    title: "Crop quality assessment", intro: "Capture a new crop photo and current GPS location before submitting.",
    steps: ["Capture live crop photo", "Get GPS location", "Review and confirm", "Submit assessment"],
    startCamera: "Open camera", capture: "Capture photo", retake: "Retake photo", confirmPhoto: "Confirm photo",
    getLocation: "Get current location", retryLocation: "Retry location", confirmReview: "I reviewed this photo and the GPS details.",
    submit: "Submit quality assessment", cancel: "Cancel assessment", switchCamera: "Switch front/back camera",
    live: "Live camera preview", savedPhoto: "Photo captured in this session", noPhoto: "A new live photo is required. Gallery uploads are not accepted.",
    noLocation: "A current GPS reading with accuracy within 100 meters is required.",
    caveat: "Camera and GPS do not prove a photo is authentic or tamper-proof. This prototype does not analyze image quality. Photos cannot confirm moisture, pesticide residues, internal defects, or hidden properties.",
  },
  te: {
    title: "పంట నాణ్యత అంచనా", intro: "సమర్పించే ముందు కొత్త పంట ఫోటో మరియు ప్రస్తుత GPS స్థానాన్ని పొందండి.",
    steps: ["లైవ్ పంట ఫోటో తీయండి", "GPS స్థానం పొందండి", "సమీక్షించి నిర్ధారించండి", "అంచనాను సమర్పించండి"],
    startCamera: "కెమెరా తెరవండి", capture: "ఫోటో తీయండి", retake: "మళ్లీ ఫోటో తీయండి", confirmPhoto: "ఫోటో నిర్ధారించండి",
    getLocation: "ప్రస్తుత స్థానం పొందండి", retryLocation: "స్థానాన్ని మళ్లీ ప్రయత్నించండి", confirmReview: "నేను ఫోటో మరియు GPS వివరాలను సమీక్షించాను.",
    submit: "నాణ్యత అంచనాను సమర్పించండి", cancel: "అంచనాను రద్దు చేయండి", switchCamera: "ముందు/వెనుక కెమెరా మార్చండి",
    live: "లైవ్ కెమెరా ప్రివ్యూ", savedPhoto: "ఈ సెషన్‌లో ఫోటో తీశారు", noPhoto: "కొత్త లైవ్ ఫోటో అవసరం. గ్యాలరీ ఫోటోలు అంగీకరించబడవు.",
    noLocation: "100 మీటర్లలోపు ఖచ్చితత్వంతో ప్రస్తుత GPS అవసరం.",
    caveat: "కెమెరా మరియు GPS ఫోటో అసలైనదని లేదా మార్పులు చేయలేదని నిరూపించవు. ఈ నమూనా ఫోటో నాణ్యతను విశ్లేషించదు. తేమ, పురుగుమందుల అవశేషాలు, అంతర్గత లోపాలు లేదా కనిపించని లక్షణాలను ఫోటో నిర్ధారించదు.",
  },
};

function QualityVerification({ crop, farmerId, language = "en", databaseMode = false, onBack, onSubmit }) {
  const copy = text[language] || text.en;
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequestRef = useRef(0);
  const locationRequestRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCapturedAt, setPhotoCapturedAt] = useState("");
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationConsent, setLocationConsent] = useState(false);
  const [consentAt, setConsentAt] = useState("");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const [submittedWarning, setSubmittedWarning] = useState("");

  const hasValidGps = location && location.accuracy <= MAX_GPS_ACCURACY_METERS;
  const canSubmit = Boolean(photoBlob && photoConfirmed && hasValidGps && locationConsent && reviewConfirmed && !submitting && !submittedId);
  const currentStep = submittedId ? 4 : !photoBlob ? 1 : !hasValidGps ? 2 : !photoConfirmed || !reviewConfirmed ? 3 : 4;

  function stopCamera() {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStatus("idle");
  }

  async function startCamera(mode = facingMode) {
    setCameraError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setCameraError("Camera access requires HTTPS or localhost and a browser that supports live camera capture.");
      return;
    }
    stopCamera();
    const requestId = ++cameraRequestRef.current;
    setCameraStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setCameraStatus("ready");
    } catch (error) {
      if (cameraRequestRef.current !== requestId) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraStatus("error");
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        setCameraError("Camera permission was denied. Allow camera access in browser settings and try again.");
      } else if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
        setCameraError("No compatible camera was found on this device.");
      } else {
        setCameraError("The camera could not be opened. Close other camera apps and retry.");
      }
    }
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Wait for the live preview to appear before taking a photo.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("This browser could not prepare the captured image.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) {
      setCameraError("The photo could not be captured. Please try again.");
      return;
    }
    setPhotoBlob(blob);
    setPhotoUrl(URL.createObjectURL(blob));
    setPhotoCapturedAt(new Date().toISOString());
    setPhotoConfirmed(false);
    setReviewConfirmed(false);
    locationRequestRef.current += 1;
    setLocation(null);
    setLocationStatus("idle");
    setLocationError("");
    setSubmitError("");
    stopCamera();
  }

  function retakePhoto() {
    locationRequestRef.current += 1;
    setPhotoBlob(null);
    setPhotoUrl("");
    setPhotoCapturedAt("");
    setPhotoConfirmed(false);
    setReviewConfirmed(false);
    setLocation(null);
    setLocationStatus("idle");
    setLocationError("");
    startCamera();
  }

  function captureLocation() {
    if (!locationConsent) {
      setLocationError("Please consent to collecting and sharing precise GPS location for this assessment first.");
      return;
    }
    setLocationError("");
    setLocationStatus("loading");
    const requestId = ++locationRequestRef.current;
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Location is not supported by this browser. Use a device browser with location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      if (locationRequestRef.current !== requestId) return;
      const coords = position.coords;
      const gpsTimestamp = Number(position.timestamp);
      const validCoordinates = Number.isFinite(coords.latitude)
        && Number.isFinite(coords.longitude)
        && coords.latitude >= -90 && coords.latitude <= 90
        && coords.longitude >= -180 && coords.longitude <= 180;
      if (!validCoordinates || !Number.isFinite(coords.accuracy) || coords.accuracy < 0
        || !Number.isFinite(gpsTimestamp) || Date.now() - gpsTimestamp > MAX_GPS_AGE_MILLISECONDS
        || gpsTimestamp - Date.now() > 5000) {
        setLocation(null);
        setLocationStatus("error");
        setLocationError("The device returned an invalid or stale location. Retry GPS and check device settings.");
        return;
      }
      const reading = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: new Date(gpsTimestamp).toISOString(),
      };
      setLocation(reading);
      setLocationStatus(coords.accuracy <= MAX_GPS_ACCURACY_METERS ? "ready" : "inaccurate");
      setLocationError(coords.accuracy <= MAX_GPS_ACCURACY_METERS
        ? ""
        : `GPS accuracy is ${Math.round(coords.accuracy)} m. The required maximum is ${MAX_GPS_ACCURACY_METERS} m. Retry outdoors or enable precise location.`);
      setReviewConfirmed(false);
    }, (error) => {
      if (locationRequestRef.current !== requestId) return;
      setLocation(null);
      setLocationStatus("error");
      if (error.code === error.PERMISSION_DENIED) {
        setLocationError("Location permission was denied. Allow location access in browser settings, then retry.");
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setLocationError("The device could not determine your location. Enable device location services and retry.");
      } else {
        setLocationError("GPS timed out. Move outdoors or retry when location is available.");
      }
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  async function submitAssessment() {
    if (!photoBlob || !photoConfirmed || !hasValidGps || !locationConsent || !reviewConfirmed) {
      setSubmitError("Capture and confirm a live photo, consent to GPS collection, get accurate GPS, and review both before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const id = databaseMode ? "" : createId("assessment");
    const submittedAt = new Date().toISOString();
    const assessment = {
      id,
      cropId: crop.id,
      cropName: crop.crop,
      farmerId: farmerId || null,
      photoCapturedAt,
      gps: location,
      gpsCapturedAt: location.timestamp,
      consentAt,
      submittedAt,
      status: databaseMode ? "Submitted; awaiting expert review" : "Submitted; awaiting expert review (local prototype)",
      result: { grade: null, confidence: null, observations: [], message: "No image-analysis model is configured." },
      integrityNote: "Browser camera and GPS metadata do not prove photo authenticity or prevent tampering.",
      photoMimeType: photoBlob.type,
      photoSizeBytes: photoBlob.size,
    };
    try {
      let saved;
      if (databaseMode) {
        saved = await onSubmit(assessment, photoBlob);
      } else {
        await saveAssessmentPhoto(id, photoBlob);
        saved = await onSubmit(assessment, photoBlob);
        if (!saved) {
          await deleteAssessmentPhoto(id);
          throw new Error("Assessment details could not be saved. Check browser storage and retry.");
        }
      }
      setSubmittedId(saved?.id || id);
      setSubmittedWarning(saved?.refreshWarning || "");
      stopCamera();
    } catch (error) {
      setSubmitError(error.message || "The assessment could not be saved. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  function cancelAssessment() {
    stopCamera();
    locationRequestRef.current += 1;
    setPhotoBlob(null);
    setPhotoUrl("");
    setPhotoCapturedAt("");
    setLocation(null);
    setLocationStatus("idle");
    setPhotoConfirmed(false);
    setReviewConfirmed(false);
    onBack();
  }

  useEffect(() => () => {
    cameraRequestRef.current += 1;
    locationRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready" || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => {
      setCameraError("Camera preview could not start. Close the camera and retry.");
      stopCamera();
      setCameraStatus("error");
    });
  }, [cameraStatus]);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const timestamp = (value) => value ? new Date(value).toLocaleString() : "Not captured";

  return <main className="quality-assessment">
    <header className="quality-header"><button className="button button-quiet" onClick={cancelAssessment}><ArrowLeft size={17} />{copy.cancel}</button><div><p className="eyebrow">CROP QUALITY · LIVE EVIDENCE</p><h1>{copy.title}</h1><p>{crop.crop} · {crop.location || "Location not listed"}</p></div><span className="demo-tag">{databaseMode ? "PRIVATE DATABASE EVIDENCE" : "LOCAL PROTOTYPE"}</span></header>
    <p className="quality-intro">{copy.intro}</p>
    <ol className="quality-steps">{copy.steps.map((step, index) => <li key={step} className={currentStep === index + 1 ? "current" : submittedId && index < 4 ? "complete" : ""}><span>{submittedId || index + 1 < currentStep ? <Check size={14} /> : index + 1}</span>{step}</li>)}</ol>

    {!submittedId ? <>
      <section className="quality-panel"><div className="quality-panel-heading"><span className="quality-step-number">1</span><div><h2>Capture a live photo</h2><p>{copy.noPhoto}</p></div></div>
        {cameraStatus === "ready" && <div className="quality-camera"><video ref={videoRef} autoPlay playsInline muted aria-label={copy.live} /><span className="live-indicator">LIVE</span></div>}
        {cameraStatus === "loading" && <div className="quality-camera-placeholder" role="status">Opening camera…</div>}
        {cameraError && <p className="quality-error" role="alert">{cameraError}</p>}
        {cameraStatus === "ready" ? <div className="quality-controls"><button className="button button-primary" onClick={capturePhoto}><Camera size={17} />{copy.capture}</button><button className="button button-quiet" onClick={() => { const next = facingMode === "environment" ? "user" : "environment"; setFacingMode(next); startCamera(next); }}>{copy.switchCamera}</button><button className="button button-quiet" onClick={stopCamera}><X size={16} />Close camera</button></div> : <button className="button button-primary" onClick={() => startCamera()} disabled={cameraStatus === "loading"}><Camera size={17} />{copy.startCamera}</button>}
        {photoUrl && <div className="quality-captured-photo"><img src={photoUrl} alt="Photo captured live from this assessment session" /><div><strong>{copy.savedPhoto}</strong><small>Captured: {timestamp(photoCapturedAt)}</small><div className="quality-controls"><button className="button button-quiet" onClick={retakePhoto}><RotateCcw size={16} />{copy.retake}</button><button className={`button ${photoConfirmed ? "button-confirmed" : "button-primary"}`} onClick={() => { setPhotoConfirmed(true); setReviewConfirmed(false); }}><Check size={16} />{photoConfirmed ? "Photo confirmed" : copy.confirmPhoto}</button></div></div></div>}
      </section>

      <section className="quality-panel"><div className="quality-panel-heading"><span className="quality-step-number">2</span><div><h2>Get current GPS location</h2><p>{copy.noLocation}</p></div></div>
        <label className="quality-review-check"><input type="checkbox" checked={locationConsent} onChange={(event) => {
          const consentGiven = event.target.checked;
          setLocationConsent(consentGiven);
          setConsentAt(consentGiven ? new Date().toISOString() : "");
          if (!consentGiven) {
            setLocation(null);
            setLocationStatus("idle");
            setReviewConfirmed(false);
            setLocationError("");
          }
        }} />I consent to collecting my precise GPS location and associating it with this quality assessment. It will be stored for authorized assessment review.</label>
        {location && <div className={`quality-location ${hasValidGps ? "valid" : "invalid"}`}><MapPin size={19} /><div><strong>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</strong><span>Accuracy: {location.accuracy.toFixed(1)} m</span><small>Reading: {timestamp(location.timestamp)}</small></div></div>}
        {locationError && <p className="quality-error" role="alert">{locationError}</p>}
        <button className="button button-quiet" onClick={captureLocation} disabled={!locationConsent || locationStatus === "loading"}><MapPin size={17} />{locationStatus === "loading" ? "Getting location…" : location ? copy.retryLocation : copy.getLocation}</button>
      </section>

      <section className="quality-panel"><div className="quality-panel-heading"><span className="quality-step-number">3</span><div><h2>Review and confirm</h2><p>Check the captured image and GPS reading before submission.</p></div></div>
        <div className="quality-review-summary"><span>Photo <strong>{photoConfirmed ? "Confirmed" : photoBlob ? "Needs confirmation" : "Missing"}</strong><small>{timestamp(photoCapturedAt)}</small></span><span>GPS <strong>{hasValidGps ? "Accurate enough" : location ? "Retry required" : "Missing"}</strong><small>{location ? `${location.accuracy.toFixed(1)} m · ${timestamp(location.timestamp)}` : "Current reading required"}</small></span></div>
        <label className="quality-review-check"><input type="checkbox" checked={reviewConfirmed} disabled={!photoConfirmed || !hasValidGps} onChange={(event) => setReviewConfirmed(event.target.checked)} />{copy.confirmReview}</label>
      </section>

      <section className="quality-submit"><div className="quality-panel-heading"><span className="quality-step-number">4</span><div><h2>Submit assessment</h2><p>Photo and GPS metadata are linked to the same assessment record.</p></div></div>
        <p className="quality-integrity"><ShieldAlert size={18} />{copy.caveat}</p>
        {!canSubmit && <p className="quality-blocked" role="status">{!photoBlob || !photoConfirmed ? "A captured and confirmed live photo is required. " : ""}{!locationConsent ? "Consent to precise GPS collection is required. " : ""}{!hasValidGps ? "A fresh GPS reading with accuracy within 100 m is required. " : ""}{!reviewConfirmed ? "Review and confirm both details to continue." : ""}</p>}
        {submitError && <p className="quality-error" role="alert">{submitError}</p>}
        <button className="button button-primary quality-submit-button" onClick={submitAssessment} disabled={!canSubmit}>{submitting ? "Saving assessment…" : copy.submit}</button>
      </section>
    </> : <section className="quality-success" role="status"><span><Check size={24} /></span><h2>Assessment saved</h2><p>Assessment ID: <strong>{submittedId}</strong></p><p>Status: submitted for review. No quality grade or AI result was generated.</p>{submittedWarning && <p className="quality-error">{submittedWarning}</p>}<button className="button button-primary" onClick={onBack}>Return to crop quality</button></section>}
  </main>;
}

export default QualityVerification;