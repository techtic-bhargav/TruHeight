import { Avatar, QuestionAnswer, QuestionAnswersResponse } from '@/api/endpoints/auth';
import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';

export type ProfileType = 'child' | 'self';

export interface ProfileData {
  // Step 1
  step1?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    selectedAvatarIndex?: number;

    selectedImageType?: 'avatar' | 'custom';
    avatarId?: string | null;
    avatarUrl?: string | null;
    uploadedImageUrl?: string | null; // Server uploaded URL for custom images
  };
  // Step 2
  step2?: {
    dateOfBirth?: Date;
  };
  // Step 3
  step3?: {
    gender?: string;
  };
  // Step 4
  step4?: {
    measurementSystem?: 'metric' | 'imperial';
    height?: {
      metric?: number;
      imperial?: { feet: number; inches: number };
    };
  };
  // Step 5
  step5?: {
    measurementSystem?: 'metric' | 'imperial';
    weight?: {
      metric?: number;
      imperial?: number;
    };
  };
  // Step 6
  step6?: {
    measurementSystem?: 'metric' | 'imperial';
    dadHeight?: {
      metric?: number;
      imperial?: { feet: number; inches: number };
    };
    motherHeight?: {
      metric?: number;
      imperial?: { feet: number; inches: number };
    };
  };
  // Step 7
  step7?: {
    ethnicity?: string;
  };
  // Step 8
  step8?: {
    sleepDuration?: string;
  };
  // Step 9
  step9?: {
    activityLevel?: string;
  };
  // Step 10
  step10?: {
    nutritionConsistency?: string;
  };
  // Step 11
  step11?: {
    supplements?: string;
  };
}

interface ProfileContextType {
  profileType: ProfileType;
  setProfileType: (type: ProfileType) => void;
  isAddingChild: boolean;
  setIsAddingChild: (value: boolean) => void;
  questions: QuestionAnswer[];
  setQuestions: (questions: QuestionAnswer[]) => void;
  questionAnswersResponse: QuestionAnswersResponse | null;
  setQuestionAnswersResponse: (response: QuestionAnswersResponse | null) => void;
  getQuestionByOrder: (order: number) => QuestionAnswer | undefined;
  avatars: (Avatar & { image?: string; image_url?: string; type?: 'api' | 'custom' })[];
  setAvatars: React.Dispatch<React.SetStateAction<(Avatar & { image?: string; image_url?: string; type?: 'api' | 'custom' })[]>>;
  isLoadingAvatars: boolean;
  setIsLoadingAvatars: (loading: boolean) => void;
  profileData: ProfileData;
  updateProfileData: (step: keyof ProfileData, data: any) => void;
  getAllProfileData: () => ProfileData;
  clearProfileData: () => void;
  cachedProfileResponse: any;
  setCachedProfileResponse: (data: any) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileType, setProfileType] = useState<ProfileType>('child');
  const [isAddingChild, setIsAddingChild] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [questionAnswersResponse, setQuestionAnswersResponse] = useState<QuestionAnswersResponse | null>(null);
  const [avatars, setAvatars] = useState<(Avatar & { image?: string; image_url?: string; type?: 'api' | 'custom' })[]>([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [cachedProfileResponse, setCachedProfileResponse] = useState<any>(null);

  const getQuestionByOrder = (order: number): QuestionAnswer | undefined => {
    // Handle both string and number order values from API
    return questions.find((q) => {
      const qOrder = typeof q.order === 'string' ? parseInt(q.order, 10) : q.order;
      return qOrder === order;
    });
  };

  const updateProfileData = (step: keyof ProfileData, data: any) => {
    setProfileData((prev) => ({
      ...prev,
      [step]: data,
    }));
  };

  const profileDataRef = useRef<ProfileData>(profileData);
  profileDataRef.current = profileData;

  const getAllProfileData = useCallback((): ProfileData => {
    return profileDataRef.current;
  }, []);

  const clearProfileData = useCallback(() => {
    setProfileData({});
  }, []);

  // Log response when it changes
  React.useEffect(() => {
    if (questionAnswersResponse) {
      console.log('📋 ProfileContext - questionAnswersResponse:', JSON.stringify(questionAnswersResponse, null, 2));
    }
  }, [questionAnswersResponse]);

  // Log profile data when it changes
  React.useEffect(() => {
    console.log('📋 ProfileContext - profileData updated:', JSON.stringify(profileData, null, 2));
  }, [profileData]);

  return (
    <ProfileContext.Provider value={{
      profileType,
      setProfileType,
      isAddingChild,
      setIsAddingChild,
      questions,
      setQuestions,
      questionAnswersResponse,
      setQuestionAnswersResponse,
      getQuestionByOrder,
      avatars,
      setAvatars,
      isLoadingAvatars,
      setIsLoadingAvatars,
      profileData,
      updateProfileData,
      getAllProfileData,
      clearProfileData,
      cachedProfileResponse,
      setCachedProfileResponse,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
