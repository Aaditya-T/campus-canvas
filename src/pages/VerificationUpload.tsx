import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, FileImage, User, Camera, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VerificationUpload = () => {
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [admissionSlipFile, setAdmissionSlipFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [admissionSlipPreview, setAdmissionSlipPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const idCardInputRef = useRef<HTMLInputElement>(null);
  const admissionSlipInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { user, profile, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Please log in",
        description: "You need to log in first to verify your account",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  // Check if already submitted
  useEffect(() => {
    if (profile?.status === 'approved') {
      navigate('/');
    }
  }, [profile?.status, navigate]);

  if (profile?.submitted_at && !isSubmitted) {
    setIsSubmitted(true);
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream once the video element is mounted
  useEffect(() => {
    if (!isCameraActive || !stream || !videoRef.current) return;

    const video = videoRef.current;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const handleLoadedMetadata = () => {
      void video.play().catch(() => {
        // Autoplay can be blocked; user can retry by toggling the camera.
      });
    };

    video.onloadedmetadata = handleLoadedMetadata;

    return () => {
      video.onloadedmetadata = null;
    };
  }, [isCameraActive, stream]);

  const handleFileSelect = (
    file: File | null,
    type: 'idCard' | 'admissionSlip' | 'selfie'
  ) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'idCard') {
        setIdCardFile(file);
        setIdCardPreview(result);
      } else if (type === 'admissionSlip') {
        setAdmissionSlipFile(file);
        setAdmissionSlipPreview(result);
      } else if (type === 'selfie') {
        setSelfieFile(file);
        setSelfiePreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'idCard' | 'admissionSlip' | 'selfie') => {
    if (type === 'idCard') {
      setIdCardFile(null);
      setIdCardPreview(null);
      if (idCardInputRef.current) idCardInputRef.current.value = '';
    } else if (type === 'admissionSlip') {
      setAdmissionSlipFile(null);
      setAdmissionSlipPreview(null);
      if (admissionSlipInputRef.current) admissionSlipInputRef.current.value = '';
    } else if (type === 'selfie') {
      setSelfieFile(null);
      setSelfiePreview(null);
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front-facing camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take a selfie",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      // Convert canvas to blob, then to File
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const file = new File([blob], `selfie_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        setSelfieFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelfiePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Stop camera after capture
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in first",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Validate that at least one ID document is uploaded
    if (!idCardFile && !admissionSlipFile) {
      toast({
        title: "Missing document",
        description: "Please upload either an ID card or admission slip",
        variant: "destructive"
      });
      return;
    }

    // Validate selfie is uploaded
    if (!selfieFile) {
      toast({
        title: "Missing selfie",
        description: "Please upload a selfie",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const userId = user.id;
      const uploads: { type: string; path: string }[] = [];

      // Upload ID card if provided
      if (idCardFile) {
        const fileName = `id_card_${Date.now()}.${idCardFile.name.split('.').pop()}`;
        const filePath = `${userId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(filePath, idCardFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        uploads.push({ type: 'id_card', path: filePath });
      }

      // Upload admission slip if provided
      if (admissionSlipFile) {
        const fileName = `admission_slip_${Date.now()}.${admissionSlipFile.name.split('.').pop()}`;
        const filePath = `${userId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('verification-documents')
          .upload(filePath, admissionSlipFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        uploads.push({ type: 'admission_slip', path: filePath });
      }

      // Upload selfie
      const selfieFileName = `selfie_${Date.now()}.jpg`;
      const selfieFilePath = `${userId}/${selfieFileName}`;
      
      const { error: selfieError } = await supabase.storage
        .from('verification-documents')
        .upload(selfieFilePath, selfieFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (selfieError) throw selfieError;
      uploads.push({ type: 'selfie', path: selfieFilePath });

      // Update profile with document paths
      const updateData: any = {
        selfie_path: selfieFilePath,
        submitted_at: new Date().toISOString()
      };

      if (idCardFile) {
        updateData.id_card_path = uploads.find(u => u.type === 'id_card')?.path;
      }
      if (admissionSlipFile) {
        updateData.admission_slip_path = uploads.find(u => u.type === 'admission_slip')?.path;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      await refreshProfile();
      setIsSubmitted(true);

      toast({
        title: "Documents submitted!",
        description: "Your verification documents have been submitted for review. Please check back within 24 hours for approval status."
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl sketch-border bg-card p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="font-hand text-3xl md:text-4xl mb-4">Verification Pending</h1>
          <p className="font-comic text-lg text-muted-foreground mb-6">
            Your documents have been submitted for review. Please check back within 24 hours for your approval status.
          </p>
          <p className="font-comic text-sm text-muted-foreground">
            <strong>Note:</strong> All uploaded documents will be permanently deleted after review for your privacy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-hand text-3xl md:text-4xl mb-4 marker-underline">
            Verify Your Account
          </h1>
          <p className="font-comic text-muted-foreground">
            Please upload the required documents to verify your student status
          </p>
        </div>

        <div className="sketch-border bg-card p-6 md:p-8 space-y-6">
          {/* Privacy Notice */}
          <div className="bg-accent/20 p-4 sketch-border-sm">
            <p className="font-comic text-sm text-foreground">
              <strong>🔒 Privacy Notice:</strong> Your verification documents will be reviewed by administrators and permanently deleted after review. We do not store your personal documents.
            </p>
          </div>

          {/* ID Card or Admission Slip */}
          <div>
            <label className="font-comic font-bold text-lg mb-2 block">
              ID Card <span className="text-muted-foreground font-normal">OR</span> Admission Slip *
            </label>
            <p className="font-comic text-sm text-muted-foreground mb-3">
              Upload either your student ID card or admission slip
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* ID Card Upload */}
              <div>
                <label className="font-comic text-sm mb-2 block">ID Card</label>
                <input
                  ref={idCardInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'idCard')}
                  className="hidden"
                  id="idCardInput"
                />
                {idCardPreview ? (
                  <div className="relative sketch-border-sm">
                    <img src={idCardPreview} alt="ID Card preview" className="w-full h-48 object-contain bg-background" />
                    <button
                      onClick={() => removeFile('idCard')}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="idCardInput"
                    className="flex flex-col items-center justify-center h-48 sketch-border-sm bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <FileImage size={32} className="mb-2 text-muted-foreground" />
                    <span className="font-comic text-sm text-muted-foreground">Click to upload ID card</span>
                  </label>
                )}
              </div>

              {/* Admission Slip Upload */}
              <div>
                <label className="font-comic text-sm mb-2 block">Admission Slip</label>
                <input
                  ref={admissionSlipInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'admissionSlip')}
                  className="hidden"
                  id="admissionSlipInput"
                />
                {admissionSlipPreview ? (
                  <div className="relative sketch-border-sm">
                    <img src={admissionSlipPreview} alt="Admission slip preview" className="w-full h-48 object-contain bg-background" />
                    <button
                      onClick={() => removeFile('admissionSlip')}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="admissionSlipInput"
                    className="flex flex-col items-center justify-center h-48 sketch-border-sm bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <FileImage size={32} className="mb-2 text-muted-foreground" />
                    <span className="font-comic text-sm text-muted-foreground">Click to upload admission slip</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Live Selfie Capture */}
          <div>
            <label className="font-comic font-bold text-lg mb-2 block">
              Live Selfie *
            </label>
            <p className="font-comic text-sm text-muted-foreground mb-3">
              Take a live selfie using your device camera
            </p>
            
            <div className="max-w-md mx-auto">
              {selfiePreview ? (
                <div className="relative sketch-border-sm">
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-64 object-contain bg-background rounded" />
                  <button
                    onClick={() => removeFile('selfie')}
                    className="absolute top-2 right-2 p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
                    title="Retake selfie"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="relative sketch-border-sm">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover bg-background rounded"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-background/90 sketch-border-sm font-comic text-sm hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={captureSelfie}
                      className="px-6 py-2 bg-primary text-primary-foreground sketch-border-sm font-comic text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Camera size={18} />
                      Capture
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sketch-border-sm bg-muted/30 rounded">
                  <button
                    onClick={startCamera}
                    className="w-full h-64 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors rounded"
                  >
                    <Camera size={48} className="mb-3 text-muted-foreground" />
                    <span className="font-comic text-base text-muted-foreground">Click to open camera</span>
                    <span className="font-comic text-xs text-muted-foreground mt-1">We'll take a live photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={isUploading || (!idCardFile && !admissionSlipFile) || !selfieFile}
              className="w-full btn-sketch-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationUpload;

