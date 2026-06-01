export interface SocialMediaPreset {
  platform: string;
  name: string;
  width: number;
  height: number;
}

export const socialMediaSizes: SocialMediaPreset[] = [
  { platform: 'Instagram', name: 'Feed Post (Square)', width: 1080, height: 1080 },
  { platform: 'Instagram', name: 'Feed Post (Portrait)', width: 1080, height: 1350 },
  { platform: 'Instagram', name: 'Feed Post (Landscape)', width: 1080, height: 566 },
  { platform: 'Instagram', name: 'Story / Reel', width: 1080, height: 1920 },
  { platform: 'Instagram', name: 'Profile Picture', width: 320, height: 320 },
  { platform: 'Instagram', name: 'Carousel', width: 1080, height: 1080 },

  { platform: 'Facebook', name: 'Feed Post', width: 1200, height: 630 },
  { platform: 'Facebook', name: 'Story', width: 1080, height: 1920 },
  { platform: 'Facebook', name: 'Cover Photo', width: 820, height: 312 },
  { platform: 'Facebook', name: 'Profile Picture', width: 170, height: 170 },
  { platform: 'Facebook', name: 'Event Cover', width: 1920, height: 1005 },
  { platform: 'Facebook', name: 'Ad (Single Image)', width: 1200, height: 628 },

  { platform: 'LinkedIn', name: 'Feed Post', width: 1200, height: 627 },
  { platform: 'LinkedIn', name: 'Story', width: 1080, height: 1920 },
  { platform: 'LinkedIn', name: 'Profile Picture', width: 400, height: 400 },
  { platform: 'LinkedIn', name: 'Company Cover', width: 1128, height: 191 },
  { platform: 'LinkedIn', name: 'Article Cover', width: 1200, height: 644 },

  { platform: 'X.com', name: 'Single Image Post', width: 1600, height: 900 },
  { platform: 'X.com', name: 'Two Images', width: 700, height: 800 },
  { platform: 'X.com', name: 'Profile Picture', width: 400, height: 400 },
  { platform: 'X.com', name: 'Header Photo', width: 1500, height: 500 },
  { platform: 'X.com', name: 'In-Stream Photo', width: 1600, height: 900 },

  { platform: 'TikTok', name: 'Video Cover', width: 1080, height: 1920 },
  { platform: 'TikTok', name: 'Profile Picture', width: 200, height: 200 },
];

export const platforms = [...new Set(socialMediaSizes.map(s => s.platform))];