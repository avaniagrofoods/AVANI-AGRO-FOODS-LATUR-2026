/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RefreshCcw, ArrowRight, ShieldCheck, 
  Factory, Globe, Leaf, Zap, Thermometer, Layers, 
  ChevronDown, CheckCircle2, FlaskConical, Box, Truck, 
  ClipboardCheck, Users, Handshake, Sprout, HeartHandshake,
  Droplets, Microscope, PackageSearch, FileText, Mail, Phone, MapPin, Download, Quote, Star, Book
} from "lucide-react";

interface Scene {
  id: number;
  type: 'intro' | 'hook' | 'value' | 'founder' | 'outro';
  titleHindi: string;
  titleEnglish: string;
  descriptionHindi: string;
  descriptionEnglish: string;
  image: string;
  duration: number; // in milliseconds
}

interface Machine {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  descriptionHindi: string;
  descriptionEnglish: string;
  tagline: string;
  image: string;
  video: string;
  icon: any;
  specs: string[];
  qualityInsight: string;
}

const MACHINES: Machine[] = [
  {
    id: "washer",
    nameHindi: "ट्रिपल-स्टेज ऑटोमैटिक वाशर",
    nameEnglish: "Triple-Stage Automatic Washer",
    descriptionHindi: "धूल, धूल के कणों और अशुद्धियों को 100% हटाने के लिए ओजोन-इंफ्यूज्ड सफाई प्रणाली।",
    descriptionEnglish: "Ozone-infused cleaning system for 100% removal of dust, mites, and impurities.",
    tagline: "Ultra-Hygienic Start",
    image: "https://images.unsplash.com/photo-1590402444587-438e6d7edce2?q=80&w=2070&auto=format&fit=crop",
    video: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-farmer-harvesting-green-leaves-41716-large.mp4",
    icon: Leaf,
    specs: ["Ozone Cleaning", "3-Stage Filtration", "Gentle Leaf Handling"],
    qualityInsight: "ओजोन उपचार बैक्टीरिया और कीटनाशकों के अवशेषों को पूरी तरह से समाप्त कर देता है, जिससे यह ऑर्गेनिक एक्सपोर्ट के लिए सुरक्षित हो जाता है।"
  },
  {
    id: "dehydrator",
    nameHindi: "कोल्ड-ड्राय डिहाइड्रेटर",
    nameEnglish: "Cold-Dry Dehydrator",
    descriptionHindi: "पोषक तत्वों और गहरे हरे रंग को सुरक्षित रखने के लिए कम तापमान वाली डिहाइड्रेशन तकनीक।",
    descriptionEnglish: "Low-temperature dehydration technology to preserve nutrients and deep green color.",
    tagline: "Nutrient Retention",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
    video: "https://assets.mixkit.co/videos/preview/mixkit-checking-the-temperature-of-a-food-batch-40394-large.mp4",
    icon: Thermometer,
    specs: ["< 40°C Temp Control", "PLC Automated", "Uniform Air Flow"],
    qualityInsight: "40°C से कम तापमान पर सुखाना यह सुनिश्चित करता है कि मोरिंगा के विटामिन A और C जैसे संवेदनशील पोषक तत्व 95% से अधिक संरक्षित रहें।"
  },
  {
    id: "pulverizer",
    nameHindi: "प्रिसिजन पल्वेराइज़र (SS 304)",
    nameEnglish: "Precision Pulverizer (SS 304)",
    descriptionHindi: "बिना गर्मी पैदा किए 120+ मेश का सूक्ष्म पाउडर बनाने वाली स्टेनलेस स्टील मशीन।",
    descriptionEnglish: "Stainless steel machine producing 120+ mesh micro-powder without heat generation.",
    tagline: "Super-Fine Texture",
    image: "https://images.unsplash.com/photo-1581093458791-9f3c3250bb8b?q=80&w=2070&auto=format&fit=crop",
    video: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-working-factory-machine-40387-large.mp4",
    icon: Zap,
    specs: ["Zero Heat Grinding", "Food Grade SS 304", "Controlled Micron Size"],
    qualityInsight: "कोल्ड ग्राइंडिंग तकनीक ऑक्सीकरण को रोकती है, जिससे पाउडर का रंग और क्लोरोफिल की मात्रा प्राकृतिक बनी रहती है।"
  },
  {
    id: "sifter",
    nameHindi: "मल्टी-स्टेज वाइब्रो शिफ्टर",
    nameEnglish: "Multi-Stage Vibro Sifter",
    descriptionHindi: "अंतरराष्ट्रीय एक्सपोर्ट मानकों के लिए सटीक कण आकार और शुद्धता सुनिश्चित करना।",
    descriptionEnglish: "Ensuring precise particle size and purity for international export standards.",
    tagline: "Export Perfection",
    image: "https://images.unsplash.com/photo-1566933261907-7bc970ec7048?q=80&w=2070&auto=format&fit=crop",
    video: "https://assets.mixkit.co/videos/preview/mixkit-conveyor-belt-carrying-bottles-in-a-factory-40393-large.mp4",
    icon: Layers,
    specs: ["Anti-Clogging Mesh", "High Throughput", "Batch Consistency"],
    qualityInsight: "अल्ट्रा-फाइन छलनी यह सुनिश्चित करती है कि कोई भी विदेशी कण या रेशे पाउडर में न रहें, जिससे 100% शुद्ध पाउडर मिलता है।"
  }
];

const SCENES: Scene[] = [
  {
    id: 1,
    type: 'hook',
    titleHindi: "महत्वपूर्ण राज़",
    titleEnglish: "The Export Secret",
    descriptionHindi: "“इंपोर्टर्स कम गुणवत्ता वाले मोरिंगा पाउडर को क्यों रिजेक्ट करते हैं?”",
    descriptionEnglish: "“Why importers reject low-quality moringa powder.”",
    image: "https://images.unsplash.com/photo-1622212992331-527265287bf0?q=80&w=1974&auto=format&fit=crop",
    duration: 3500
  },
  {
    id: 2,
    type: 'founder',
    titleHindi: "सचिन शिंदे की कहानी",
    titleEnglish: "Sachin Shinde Story",
    descriptionHindi: "एक विजनरी उद्यमी जिन्होंने भारतीय किसानों को वैश्विक बाजार से जोड़ा।",
    descriptionEnglish: "A visionary entrepreneur connecting Indian farmers to global markets.",
    image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop",
    duration: 4500
  },
  {
    id: 3,
    type: 'value',
    titleHindi: "लातूर से शुद्ध सोर्सिंग",
    titleEnglish: "Sourcing from Latur",
    descriptionHindi: "महाराष्ट्र के लातूर के समृद्ध खेतों से सीधे ताजे मोरिंगा पत्तों का चयन।",
    descriptionEnglish: "Direct selection of fresh Moringa leaves from the rich fields of Latur, Maharashtra.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop",
    duration: 4000
  },
  {
    id: 4,
    type: 'value',
    titleHindi: "प्रिसिजन प्रोसेसिंग",
    titleEnglish: "Precision Processing",
    descriptionHindi: "अत्याधुनिक और ऑटोमेटेड प्रिसिजन मशीनों द्वारा हाइजीनिक प्रोसेसिंग।",
    descriptionEnglish: "State-of-the-art precision automated machines ensuring hygienic processing.",
    image: "https://images.unsplash.com/photo-1581092921461-7d6570975d0b?q=80&w=2070&auto=format&fit=crop",
    duration: 4000
  },
  {
    id: 5,
    type: 'value',
    titleHindi: "एक्सपोर्ट-ग्रेड पैकेजिंग",
    titleEnglish: "Export-Grade Packaging",
    descriptionHindi: "अंतरराष्ट्रीय मानकों के अनुरूप मजबूत और एयर-टाइट एक्सपोर्ट पैकेजिंग।",
    descriptionEnglish: "Robust air-tight export-grade packaging meeting international standards.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop",
    duration: 4000
  },
  {
    id: 6,
    type: 'outro',
    titleHindi: "क्वालिटी ही हमारी पहचान",
    titleEnglish: "Quality is our Identity",
    descriptionHindi: "अवनी एग्रो फूड्स - पूरी दुनिया में शुद्धता का भरोसा।",
    descriptionEnglish: "Avani Agro Foods - Trusting purity across the globe.",
    image: "https://images.unsplash.com/photo-1560617544-b4f287e85744?q=80&w=2070&auto=format&fit=crop",
    duration: 5000
  }
];

function MachineVideoCard({ machine, index }: { machine: Machine; index: number; key?: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isHovered && !showInsight) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            video.playbackRate = 1.4;
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      video.playbackRate = 1.0;
    }
  }, [isHovered, showInsight]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowInsight(false);
      }}
      className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10"
    >
      <div className="aspect-video overflow-hidden relative bg-zinc-900">
        {/* Quality Insight Overlay */}
        <AnimatePresence>
          {showInsight && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              className="absolute inset-0 z-40 bg-green-500/10 flex flex-col items-center justify-center p-8 text-center"
            >
              <ShieldCheck className="w-12 h-12 text-green-400 mb-4" />
              <h5 className="text-green-400 font-mono text-xs tracking-widest uppercase mb-2">Quality Focus</h5>
              <p className="text-white text-lg font-medium leading-relaxed">
                {machine.qualityInsight}
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInsight(false);
                }}
                className="mt-6 text-xs text-gray-400 hover:text-white underline underline-offset-4"
              >
                Close Insight
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Static Image Thumbnail */}
        <motion.img
          animate={{ opacity: (isHovered || showInsight) ? 0 : 1, scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.5 }}
          src={machine.image}
          alt={machine.nameEnglish}
          className="absolute inset-0 w-full h-full object-cover z-10"
          referrerPolicy="no-referrer"
        />
        
        {/* Video that plays on hover */}
        <video
          ref={videoRef}
          src={machine.video}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${isHovered && !showInsight ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`}
        />

        {/* Subtle Visual Cue: Playing Indicator */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-mono text-white tracking-widest uppercase">Process Active</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-20 pointer-events-none" />
        
        {/* Hover Hint Info */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setShowInsight(!showInsight);
          }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          className="absolute top-4 right-4 z-50 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-green-500 hover:text-black transition-all"
          title="See Quality Insight"
        >
          <ShieldCheck className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="p-8 relative mt-[-60px] z-30">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-500/20">
            <machine.icon className="w-6 h-6 text-black" />
          </div>
          <span className="text-xs font-mono text-green-400 tracking-wider">
            {machine.tagline}
          </span>
        </div>

        <h3 className="text-sm text-gray-500 uppercase tracking-widest mb-1 italic">
          {machine.nameEnglish}
        </h3>
        <h4 className="text-2xl md:text-3xl font-bold mb-4">
          {machine.nameHindi}
        </h4>
        
        <p className="text-gray-400 mb-6 leading-relaxed">
          {machine.descriptionHindi}
        </p>

        <button 
          onClick={() => setShowSpecs(!showSpecs)}
          className="flex items-center justify-between w-full mb-2 group/specs"
        >
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest group-hover/specs:text-green-400 transition-colors">Technical Specifications</span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${showSpecs ? 'rotate-180 text-green-500' : ''}`} />
        </button>

        <AnimatePresence>
          {showSpecs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-3 mb-4">
                {machine.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {spec}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JourneyStep({ step, idx }: { step: any; idx: number; key?: string }) {
  const [isClicked, setIsClicked] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1 }}
      onClick={() => setIsClicked(!isClicked)}
      className="group relative cursor-pointer"
    >
      <div className={`h-full p-8 rounded-[2rem] bg-zinc-900 border ${isClicked ? 'border-green-500/50' : 'border-white/5'} hover:border-white/20 transition-all duration-300 flex flex-col items-center text-center`}>
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <step.icon className="w-7 h-7 text-white group-hover:text-green-400 transition-colors" />
        </div>
        
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 italic">Step {idx + 1}</span>
        <h4 className="text-lg font-bold text-white mb-2 leading-tight">{step.title}</h4>
        <p className="text-xs text-gray-500 mb-4">{step.eng}</p>
        
        <AnimatePresence>
          {isClicked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-white/10"
            >
              <p className="text-sm text-gray-300 leading-relaxed italic">
                {step.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!isClicked && (
          <div className="mt-auto pt-4 text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Click for info</div>
        )}
      </div>
      
      {/* Connector Arrow (Desktop Only) */}
      {idx < 7 && (
        <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-20 text-white/10">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}

export default function App() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const machineryRef = useRef<HTMLDivElement>(null);
  const currentScene = SCENES[currentSceneIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    if (isPlaying) {
      const startTime = Date.now();
      const sceneDuration = currentScene.duration;

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress((elapsed / sceneDuration) * 100);
      }, 16);

      timer = setTimeout(() => {
        if (currentSceneIndex < SCENES.length - 1) {
          setCurrentSceneIndex(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, sceneDuration);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentSceneIndex, currentScene.duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };
  
  const restart = () => {
    setCurrentSceneIndex(0);
    setProgress(0);
    setIsPlaying(true);
    setHasInteracted(true);
  };

  const scrollToMachinery = () => {
    machineryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-black font-sans text-white selection:bg-green-500/30">
      {/* SECTION 1: CINEMATIC STORY (FULL SCREEN) */}
      <section className="relative w-full h-[100svh] overflow-hidden">
        {/* Background Layer with Parallax-like effect */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
            <img
              src={currentScene.image}
              alt={currentScene.titleEnglish}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-green-500 rounded-full" />
                  <span className="text-green-400 font-mono text-sm tracking-widest uppercase">
                    {currentScene.type}
                  </span>
                </div>

                <h2 className="text-sm md:text-lg text-gray-400 font-medium mb-1 tracking-wider uppercase">
                  {currentScene.titleEnglish}
                </h2>
                <h1 className="text-4xl md:text-7xl font-serif font-bold mb-6 leading-tight cinematic-text">
                  {currentScene.titleHindi}
                </h1>

                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-2xl">
                  <p className="text-xl md:text-2xl font-medium text-white mb-2 leading-relaxed">
                    {currentScene.descriptionHindi}
                  </p>
                  <p className="text-sm md:text-base text-gray-300 italic">
                    {currentScene.descriptionEnglish}
                  </p>
                </div>

                {/* Badges for Value Scene */}
                {currentScene.type === 'value' && (
                  <div className="flex flex-wrap gap-4 mt-8">
                    <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold">Quality Assured</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold">Ready for Export</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30">
                      <Factory className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold">High-Tech Sourcing</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bars (Story Style) */}
        <div className="absolute top-8 left-8 right-8 z-30 flex gap-2">
          {SCENES.map((_, index) => (
            <div key={index} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-100 ease-linear ${
                  index < currentSceneIndex ? 'w-full' : 
                  index === currentSceneIndex ? '' : 'w-0'
                }`}
                style={index === currentSceneIndex ? { width: `${progress}%` } : {}}
              />
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute top-8 right-8 z-40 flex items-center gap-4">
          <button
            onClick={restart}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition-all active:scale-95 text-white"
            title="Restart Story"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
          <button
            onClick={togglePlay}
            className="p-4 bg-green-500 hover:bg-green-400 text-black rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
          </button>
        </div>

        {/* Navigation Indicators */}
        <div className="absolute bottom-16 right-8 z-30 flex flex-col gap-3">
          {SCENES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSceneIndex(index);
                setProgress(0);
                setHasInteracted(true);
              }}
              className={`w-2 h-8 rounded-full transition-all duration-300 ${
                index === currentSceneIndex ? 'bg-green-500 h-12' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Scroll Hint */}
        <motion.button
          onClick={scrollToMachinery}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Explore Technology</span>
          <ChevronDown className="w-6 h-6" />
        </motion.button>

        {/* Intro Backdrop if not started */}
        {currentSceneIndex === 0 && !hasInteracted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="text-center p-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8 inline-block p-6 rounded-full bg-green-500/10 border border-green-500/20"
              >
                <Leaf className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold mb-4 font-serif"
              >
                सचिन शिंदे की कहानी
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-300 mb-8 max-w-md mx-auto"
              >
                अवनी एग्रो फूड्स द्वारा संचालित मोरिंगा की गुणवत्ता और नवाचार की यात्रा।
              </motion.p>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  setIsPlaying(true);
                  setHasInteracted(true);
                }}
                className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-100"
              >
                यात्रा शुरू करें
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Branding Logo - Top Left */}
        <div className="absolute top-8 left-8 z-30 flex items-center gap-3 pointer-events-none">
          <div className="w-14 h-14 bg-white rounded-full overflow-hidden shadow-2xl border-2 border-green-500/30 p-1 flex items-center justify-center">
            <img 
              src="https://r.jina.ai/i/https://storage.googleapis.com/static-gcp-ai-studio-build/artifacts/a-c95a298a-777e-4623-9686-281b31b31b31.png" 
              alt="Avani Agro Foods Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-xl tracking-tighter leading-none text-white">
              AVANI<span className="text-green-500 italic">AGRO</span>
            </div>
            <div className="text-[8px] uppercase tracking-[0.2em] font-mono text-gray-400">
              Healthy Lifestyle
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: THE JOURNEY (PROCESS FLOW) */}
      <section className="relative py-24 px-8 md:px-16 bg-black overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
              <Globe className="w-3 h-3" />
              THE SEED-TO-SHIP PIPELINE
            </div>
            <h2 className="text-4xl md:text-7xl font-serif font-bold mb-6">संपूर्ण यात्रा (Full Process)</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              खेत से लेकर आपके हाथ तक, शुद्धता की एक अटूट गारंटी।
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                id: "farm",
                title: "सोरसिंग (Latur)",
                eng: "Farmer Sourcing",
                icon: Sprout,
                detail: "लातूर के शुद्ध वातावरण में जैविक खेती द्वारा पत्तों का उत्पादन।",
                color: "green"
              },
              {
                id: "arrival",
                title: "आगमन व जांच",
                eng: "Factory Intake",
                icon: ClipboardCheck,
                detail: "फैक्ट्री में प्रवेश पर पत्तों की ताजगी और गुणवत्ता का कड़ा निरीक्षण।",
                color: "blue"
              },
              {
                id: "washing",
                title: "धुलाई (Ozone)",
                eng: "Washing",
                icon: Droplets,
                detail: "तीन चरणों में ओजोन-युक्त पानी से सूक्ष्म अशुद्धियों की सफाई।",
                color: "cyan"
              },
              {
                id: "drying",
                title: "सुखाना (Cold)",
                eng: "Dehydration",
                icon: Thermometer,
                detail: "पोषक तत्वों को बचाने के लिए कम तापमान पर वैज्ञानिक तरीके से सुखाना।",
                color: "orange"
              },
              {
                id: "grinding",
                title: "माइक्रो-पल्वरइजिंग",
                eng: "Grinding",
                icon: Zap,
                detail: "बिना गर्मी के 120+ मेश का अल्ट्रा-फाइन पाउडर बनाना।",
                color: "yellow"
              },
              {
                id: "sifting",
                title: "ग्रेडिंग",
                eng: "Sifting",
                icon: Layers,
                detail: "सटीकता के लिए मल्टी-स्टेज वाइब्रेटिंग शिफ्टर से महीन छनाई।",
                color: "emerald"
              },
              {
                id: "testing",
                title: "लैब रिपोर्टिंग",
                eng: "Lab Analysis",
                icon: Microscope,
                detail: "प्रत्येक बैच की शुद्धता और पोषण स्तर की प्रमाणित जांच।",
                color: "purple"
              },
              {
                id: "dispatch",
                title: "पैकिंग व एक्सपोर्ट",
                eng: "Packing & Dispatch",
                icon: PackageSearch,
                detail: "निर्यात-ग्रेड वैक्यूम पैकिंग और विश्वव्यापी लॉजिस्टिक्स।",
                color: "amber"
              }
            ].map((step, idx) => (
              <JourneyStep key={step.id} step={step} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: MACHINERY SHOWCASE */}
      <section ref={machineryRef} className="relative py-24 px-8 md:px-16 bg-zinc-950 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-4">
                <Factory className="w-3 h-3" />
                TECHNICAL EXCELLENCE
              </div>
              <h2 className="text-3xl md:text-6xl font-serif font-bold mb-4">तकनीकी श्रेष्ठता</h2>
              <p className="text-xl text-gray-400">
                हमारी अत्याधुनिक प्रोसेसिंग मशीनें यह सुनिश्चित करती हैं कि मोरिंगा का हर कण अंतरराष्ट्रीय निर्यात गुणवत्ता के मानकों पर खरा उतरे।
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-6xl font-serif text-white/5 font-bold">120+ MESH</div>
              <div className="text-xs text-gray-500 tracking-[0.5em] uppercase mt-2">Ultra Fine Powder Guarantee</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {MACHINES.map((machine, index) => (
              <MachineVideoCard key={machine.id} machine={machine} index={index} />
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 p-12 rounded-[3rem] bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-green-500/20 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex-1">
              <h3 className="text-2xl md:text-4xl font-serif font-bold mb-4">निर्यात के लिए तैयार?</h3>
              <p className="text-gray-400 text-lg">
                अवनी एग्रो फूड्स यूरोप, अमेरिका और खाड़ी देशों में उच्च गुणवत्ता वाले मोरिंगा उत्पाद निर्यात करने के लिए पूरी तरह सुसज्जित है।
              </p>
            </div>
            <a 
              href="https://www.avaniagrofoods.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 py-5 bg-green-500 hover:bg-green-400 text-black rounded-full font-bold text-lg transition-all shadow-xl shadow-green-500/20 whitespace-nowrap inline-block text-center"
            >
              संपर्क करें (Contact Now)
            </a>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      </section>

      {/* SECTION: FARMER SOURCING */}
      <section className="relative py-24 px-8 md:px-16 bg-zinc-900 overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono mb-4">
                <Users className="w-3 h-3" />
                FARMER EMPOWERMENT
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">किसान साझेदारी (Farmer Sourcing)</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                अवनी एग्रो फूड्स में, हमारी गुणवत्ता खेत से शुरू होती है। हम लातूर के 500+ प्रगतिशील किसानों के साथ मिलकर काम करते हैं, उन्हें जैविक खेती और टिकाऊ प्रथाओं के लिए प्रशिक्षित करते हैं।
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Handshake,
                    title: "उचित मूल्य (Fair Pricing)",
                    desc: "बिचौलियों को हटाकर सीधे किसानों को बाजार से बेहतर दाम देना।"
                  },
                  {
                    icon: Sprout,
                    title: "जैविक प्रशिक्षण (Training)",
                    desc: "गुणवत्ता बनाए रखने के लिए अंतरराष्ट्रीय मानकों के अनुरूप खेती की शिक्षा।"
                  },
                  {
                    icon: HeartHandshake,
                    title: "दीर्घकालिक संबंध",
                    desc: "किसानों के परिवारों की उन्नति और ग्रामीण विकास में निरंतर योगदान।"
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <item.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative rounded-[3rem] overflow-hidden aspect-[4/5] md:aspect-square shadow-2xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1595066378411-9a2c2703885f?q=80&w=2070&auto=format&fit=crop" 
                alt="Farmer Sourcing Latur" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-serif font-bold text-orange-500">100%</div>
                  <div className="text-sm text-gray-200">
                    <div className="font-bold">Source Verified</div>
                    <div className="opacity-60 text-xs uppercase tracking-widest">Every leaf documented</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: EXPORT PREPARATION */}
      <section className="relative py-24 px-8 md:px-16 bg-black overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-mono text-green-500 tracking-[0.4em] uppercase mb-4">Mastering Global Logistics</h2>
            <h3 className="text-4xl md:text-7xl font-serif font-bold mb-6">निर्यात की तैयारी (Export Prep)</h3>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              अंतरराष्ट्रीय मानकों को पूरा करने के लिए हमारी सावधानीपूर्वक पैकिंग और लॉजिस्टिक प्रक्रिया। नीचे प्रत्येक चरण पर क्लिक करें।
            </p>
          </div>

          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-[40px] left-0 w-full h-[1px] bg-white/10" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-0">
              {[
                {
                  icon: FlaskConical,
                  titleHindi: "लैब टेस्टिंग",
                  titleEnglish: "Lab Testing",
                  desc: "प्रमाणित लैब द्वारा शुद्धता जांच।",
                  detail: "SGS या समकक्ष रिपोर्ट के साथ माइक्रोबियल और भारी धातु विश्लेषण।",
                  color: "blue"
                },
                {
                  icon: Box,
                  titleHindi: "वैक्यूम पैकिंग",
                  titleEnglish: "Vacuum Packing",
                  desc: "ताजगी के लिए एयर-टाइट पैकिंग।",
                  detail: "ऑक्सीजन अवशोषक के साथ ट्रिपल-लेयर एक्सपोर्ट ग्रेड पाउच।",
                  color: "green"
                },
                {
                  icon: ClipboardCheck,
                  titleHindi: "गुणवत्ता लेबल",
                  titleEnglish: "Quality Labeling",
                  desc: "बैच ट्रैकिंग और पूर्ण विवरण।",
                  detail: "प्रत्येक बैच के लिए अद्वितीय QR कोड और समाप्ति तिथि ट्रैकिंग।",
                  color: "orange"
                },
                {
                  icon: Layers,
                  titleHindi: "पैलेट्स पैकिंग",
                  titleEnglish: "Palletization",
                  desc: "सुरक्षित पारगमन के लिए सुरक्षित लोडिंग।",
                  detail: "अंतरराष्ट्रीय मानकों (ISPM-15) के अनुसार उपचारित लकड़ी के पैलेट।",
                  color: "purple"
                },
                {
                  icon: Truck,
                  titleHindi: "वैश्विक शिपिंग",
                  titleEnglish: "Global Shipping",
                  desc: "दुनिया भर में समय पर डिलीवरी।",
                  detail: "तापमान-नियंत्रित कंटेनर और रीयल-टाइम लॉजिस्टिक अपडेट।",
                  color: "emerald"
                }
              ].map((step, idx) => {
                const [isExpanded, setIsExpanded] = useState(false);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="relative z-10 flex flex-col items-center text-center cursor-pointer group"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-zinc-900 border ${isExpanded ? 'border-green-500' : 'border-white/10'} flex items-center justify-center mb-6 group-hover:border-green-500/50 transition-all duration-300 shadow-2xl relative`}>
                      <step.icon className={`w-8 h-8 md:w-10 md:h-10 text-white ${isExpanded ? 'text-green-400' : 'group-hover:text-green-400'} transition-colors duration-300`} />
                      
                      {/* Step Number Badge */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 bg-green-500 text-black text-[10px] md:text-sm font-bold rounded-full flex items-center justify-center font-mono ring-4 ring-black">
                        {idx + 1}
                      </div>
                    </div>
                    
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 italic">
                      {step.titleEnglish}
                    </h4>
                    <h5 className="text-lg md:text-xl font-bold text-white mb-3">
                      {step.titleHindi}
                    </h5>

                    <AnimatePresence mode="wait">
                      {isExpanded ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4"
                        >
                          <p className="text-sm text-green-400 font-medium bg-green-500/10 py-2 px-3 rounded-lg border border-green-500/20">
                            {step.detail}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs md:text-sm text-gray-400 leading-relaxed px-4 group-hover:text-gray-300 transition-colors"
                        >
                          {step.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Certifications and Standards */}
          <div className="mt-24">
            <motion.h4 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-2xl font-serif font-bold mb-10 text-center"
            >
              प्रमाणन और मानक (Certifications & Standards)
            </motion.h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "HACCP Certification", file: "HACCP_Avani_Agro.pdf" },
                { name: "ISO 22000:2018", file: "ISO_22000_Avani_Agro.pdf" },
                { name: "Organic Certification", file: "Organic_Cert_Avani_Agro.pdf" },
              ].map((cert, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-[2rem] bg-zinc-900 border border-white/5 hover:border-green-500/30 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-2xl group-hover:bg-red-500/20 transition-colors">
                      <FileText className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <div className="text-white font-bold leading-tight">{cert.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">Official PDF Report</div>
                    </div>
                  </div>
                  <button className="p-3 hover:bg-white/10 rounded-full transition-colors group/btn" title="Download Document">
                    <Download className="w-5 h-5 text-gray-500 group-hover:text-green-500 transition-colors" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Company Brochure CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="mt-16 p-8 rounded-[3rem] bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 flex flex-col md:flex-row items-center justify-between gap-8"
            >
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white rounded-3xl shadow-xl">
                  <Book className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h5 className="text-2xl font-bold text-white mb-2">कंपनी ब्रोशर डाउनलोड करें (Company Brochure)</h5>
                  <p className="text-gray-400">हमारे उत्पादों और अंतरराष्ट्रीय मानकों की विस्तृत जानकारी प्राप्त करें।</p>
                </div>
              </div>
              <a 
                href="https://www.avaniagrofoods.com/catalog.html" 
                target="_blank"
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg shadow-green-500/20"
              >
                <Download className="w-5 h-5" />
                Download Catalog
              </a>
            </motion.div>
          </div>

          {/* Testimonials Section */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
                <Globe className="w-3 h-3" />
                GLOBAL CLIENT FEEDBACK
              </div>
              <h3 className="text-3xl md:text-5xl font-serif font-bold mb-4">ग्राहक अनुभव (Client Testimonials)</h3>
              <p className="text-gray-400 max-w-2xl mx-auto italic">
                दुनिया भर के हमारे भागीदारों का भरोसा हमारी गुणवत्ता का सबसे बड़ा प्रमाण है।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The batch-to-batch consistency and the vibrant green color of Avani Agro's Moringa is unparalleled in the Indian market. Truly export quality.",
                  name: "Mark R.",
                  role: "Nutritional Supplement Buyer",
                  region: "Germany",
                  stars: 5
                },
                {
                  quote: "Their adherence to international safety standards and detailed lab reports made our audit process incredibly smooth. A reliable partner for US markets.",
                  name: "Sarah K.",
                  role: "Wellness Product Manager",
                  region: "USA",
                  stars: 5
                },
                {
                  quote: "Purest Moringa we've sourced. The 120-mesh fineness is perfect for our premium organic capsules. Their delivery timelines are always met.",
                  name: "Ahmed Al-M.",
                  role: "Wholesale Distributor",
                  region: "Dubai, UAE",
                  stars: 5
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative group hover:bg-white/10 transition-all"
                >
                  <Quote className="absolute top-6 right-8 w-10 h-10 text-white/5 group-hover:text-green-500/20 transition-colors" />
                  
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.stars)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>

                  <p className="text-gray-300 text-lg leading-relaxed mb-8 italic">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center font-bold text-green-500">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-bold">{testimonial.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {testimonial.region} • {testimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative bg-zinc-950 pt-24 pb-12 px-8 md:px-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-20">
            {/* Branding & Vision */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white rounded-full p-1.5 shadow-xl shadow-green-500/10">
                  <img 
                    src="https://r.jina.ai/i/https://storage.googleapis.com/static-gcp-ai-studio-build/artifacts/a-c95a298a-777e-4623-9686-281b31b31b31.png" 
                    alt="Avani Agro Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="font-bold text-2xl tracking-tighter text-white">
                    AVANI<span className="text-green-500 italic">AGRO</span> FOODS
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.3em] font-mono text-gray-500">Premium Export Quality</div>
                </div>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm mb-8">
                महाराष्ट्र के लातूर से दुनिया भर में शुद्ध और पोषक मोरिंगा तथा लाल प्याज के पाउडर का विश्वसनीय निर्यातक। (Premium exporter of pure Moringa and Red Onion powder from Latur to the world.)
              </p>
              <a 
                href="https://www.avaniagrofoods.com/catalog.html" 
                target="_blank"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
              >
                <FileText className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Company Profile (PDF)</span>
                <Download className="w-4 h-4 text-gray-500" />
              </a>
            </div>

            {/* Business Contact */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-8 border-b border-white/10 pb-2">Business Details</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-white/5 rounded-lg h-fit group-hover:bg-green-500/20 transition-colors">
                    <MapPin className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Address</div>
                    <div className="text-white text-sm font-medium">Latur, Maharashtra, India</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-2 bg-white/5 rounded-lg h-fit">
                    <Phone className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Mobile No.</div>
                    <a href="tel:+917219053645" className="text-white text-lg font-bold hover:text-green-500 transition-colors">+91 72190 53645</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-2 bg-white/5 rounded-lg h-fit">
                    <Mail className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono mb-1">Email</div>
                    <a href="mailto:sales@avaniagrofoods.com" className="text-white text-sm font-medium hover:text-green-500 transition-colors underline underline-offset-4">sales@avaniagrofoods.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-8 border-b border-white/10 pb-2">Leadership</h4>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-green-500 font-serif text-xl font-bold mb-1">Sachin Shinde</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Founder & Owner</div>
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Main Products:</div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Moringa Powder
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Red Onion Powder
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[10px] text-gray-500 font-mono tracking-widest">
              © {new Date().getFullYear()} AVANI AGRO FOODS. ALL RIGHTS RESERVED.
            </div>
            <div className="flex items-center gap-8">
              <a href="https://www.avaniagrofoods.com/" target="_blank" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white">Official Website</a>
              <div className="hidden md:block w-px h-4 bg-white/10"></div>
              <div className="text-[10px] text-green-500/80 uppercase font-bold tracking-widest animate-pulse">
                Exporting Purity Globally
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

