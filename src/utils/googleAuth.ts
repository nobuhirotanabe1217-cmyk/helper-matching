import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory ONLY (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==============================================================================
// Google Drive REST API v3 Helpers
// ==============================================================================
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export async function listDriveFiles(
  accessToken: string,
  searchQuery?: string
): Promise<DriveFileItem[]> {
  const qParts = ['trashed = false'];
  if (searchQuery && searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  const params = new URLSearchParams({
    pageSize: '25',
    fields:
      'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)',
    orderBy: 'modifiedTime desc',
    q: qParts.join(' and '),
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return (data.files || []) as DriveFileItem[];
}

export async function createDriveTextFile(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = 'text/plain'
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    mimeType,
  };

  const boundary = 'carepita_drive_multipart_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create Drive file (${res.status}): ${errText}`);
  }

  return (await res.json()) as DriveFileItem;
}

export async function updateDriveTextFile(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType = 'text/plain'
): Promise<DriveFileItem> {
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=media&fields=id,name,mimeType,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `${mimeType}; charset=UTF-8`,
      },
      body: content,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update Drive file (${res.status}): ${errText}`);
  }

  return (await res.json()) as DriveFileItem;
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete Drive file (${res.status}): ${errText}`);
  }
}

export async function getDriveFileTextContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  const isGoogleDoc = mimeType.startsWith('application/vnd.google-apps.');
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?alt=media`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`プレビューを取得できませんでした (${res.status})`);
  }

  return await res.text();
}
