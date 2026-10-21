const DATABASE_NAME = "ai-farming-intelligence-quality";
const STORE_NAME = "assessment-photos";
const DATABASE_VERSION = 1;

function openPhotoDatabase() {
  if (!window.indexedDB) {
    return Promise.reject(new Error("This browser does not support local photo storage."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local photo storage."));
  });
}

export async function saveAssessmentPhoto(assessmentId, photoBlob) {
  const database = await openPhotoDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(photoBlob, assessmentId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not save the assessment photo."));
      transaction.onabort = () => reject(transaction.error || new Error("Photo save was cancelled."));
    });
    return true;
  } finally {
    database.close();
  }
}

export async function getAssessmentPhoto(assessmentId) {
  const database = await openPhotoDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(assessmentId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Could not read the assessment photo."));
    });
  } finally {
    database.close();
  }
}

export async function deleteAssessmentPhoto(assessmentId) {
  const database = await openPhotoDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(assessmentId);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Could not remove the assessment photo."));
    });
  } finally {
    database.close();
  }
}