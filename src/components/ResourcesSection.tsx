import { useState, useEffect, useRef } from 'react';
import { Upload, Search, BookOpen, Filter, Loader2, X } from 'lucide-react';
import ResourceCard from './ResourceCard';
import { useResources, type Resource, type ResourceType, type Branch } from '@/hooks/useResources';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const branches: Branch[] = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Chemical',
  'Biotechnology',
  'Information Technology',
];

const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

const resourceTypes: ResourceType[] = ['PYQ', 'Notes', 'Book', 'Slides'];

const RESOURCES_PER_PAGE = 20;

const ResourcesSection = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Upload form state
  const [uploadBranch, setUploadBranch] = useState('');
  const [uploadSemester, setUploadSemester] = useState('');
  const [uploadType, setUploadType] = useState<ResourceType | ''>('');
  const [resourceName, setResourceName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchResources, uploadResource, loading } = useResources();

  // Fetch resources when filters change
  useEffect(() => {
    loadResources(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBranch, filterSemester, searchQuery]);

  const loadResources = async (reset = false) => {
    if (reset) {
      setOffset(0);
      setHasMore(true);
    }

    const newOffset = reset ? 0 : offset;
    const fetchedResources = await fetchResources({
      branch: filterBranch || undefined,
      semester: filterSemester || undefined,
      searchQuery: searchQuery || undefined,
      limit: RESOURCES_PER_PAGE,
      offset: newOffset,
    });

    if (reset) {
      setResources(fetchedResources);
    } else {
      setResources((prev) => [...prev, ...fetchedResources]);
    }

    setHasMore(fetchedResources.length === RESOURCES_PER_PAGE);
    setOffset(newOffset + fetchedResources.length);
  };


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to upload resources',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadBranch || !uploadSemester || !uploadType || !resourceName.trim() || !selectedFile) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields and select a file',
        variant: 'destructive',
      });
      return;
    }

    setUploadProgress(true);
    const { error } = await uploadResource(
      selectedFile,
      resourceName.trim(),
      uploadBranch,
      uploadSemester,
      uploadType as ResourceType
    );

    setUploadProgress(false);

    if (!error) {
      // Reset form
      setUploadBranch('');
      setUploadSemester('');
      setUploadType('');
      setResourceName('');
      setSelectedFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload resources
      await loadResources(true);
    }
  };

  // Validate and set file when selected
  const handleFileSelect = async (file: File) => {
    // Import validation dynamically
    const { validateFile } = await import('@/lib/fileValidation');
    const validation = await validateFile(file);
    
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error || 'File validation failed',
        variant: 'destructive',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleLoadMore = () => {
    loadResources(false);
  };

  return (
    <section className="py-16 px-4 bg-paper/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-accent-blue" strokeWidth={1.5} />
            <h2 className="text-4xl md:text-5xl font-hand text-ink">
              Study <span className="marker-underline">Resources</span>
            </h2>
          </div>
          <p className="font-comic text-muted-foreground max-w-xl mx-auto">
            Share and find PYQs, notes, books & more! Help your fellow students ace their exams 📚
          </p>
        </div>

        {/* Search & Filters */}
        <div className="sketch-border bg-paper p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent border-2 border-dashed border-ink/30 rounded-sm font-comic text-ink placeholder:text-muted-foreground focus:outline-none focus:border-accent-blue"
              />
            </div>

            {/* Filter by Branch */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="pl-9 pr-8 py-2 bg-paper border-2 border-dashed border-ink/30 rounded-sm font-comic text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent-blue"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Filter by Semester */}
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-4 py-2 bg-paper border-2 border-dashed border-ink/30 rounded-sm font-comic text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent-blue"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="btn-sketch px-4 py-2 bg-accent-yellow/30 hover:bg-accent-yellow/50 flex items-center gap-2 font-hand text-lg"
            >
              <Upload className="w-5 h-5" />
              Share Resource
            </button>
          </div>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div className="sketch-border bg-accent-yellow/10 p-6 mb-8 animate-bounce-in" style={{ transform: 'rotate(-0.5deg)' }}>
            <h3 className="font-hand text-2xl text-ink mb-4 flex items-center gap-2">
              <span className="text-2xl">📤</span> Upload a Resource
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Branch Selection */}
              <div>
                <label className="block font-comic text-sm text-muted-foreground mb-1">Branch *</label>
                <select
                  value={uploadBranch}
                  onChange={(e) => setUploadBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/40 rounded-sm font-comic text-ink focus:outline-none focus:border-accent-blue"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block font-comic text-sm text-muted-foreground mb-1">Semester *</label>
                <select
                  value={uploadSemester}
                  onChange={(e) => setUploadSemester(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/40 rounded-sm font-comic text-ink focus:outline-none focus:border-accent-blue"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Resource Type */}
              <div>
                <label className="block font-comic text-sm text-muted-foreground mb-1">Type *</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/40 rounded-sm font-comic text-ink focus:outline-none focus:border-accent-blue"
                >
                  <option value="">Select Type</option>
                  {resourceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Resource Name */}
              <div>
                <label className="block font-comic text-sm text-muted-foreground mb-1">Resource Name *</label>
                <input
                  type="text"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="e.g., DSA Notes Ch 3"
                  maxLength={200}
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/40 rounded-sm font-comic text-ink placeholder:text-muted-foreground focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-6 text-center mb-4 transition-colors cursor-pointer ${
                dragActive
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-ink/40 bg-paper/50 hover:bg-paper'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={handleFileInputChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="font-comic text-ink">{selectedFile.name}</span>
                    <span className="font-comic text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-muted-foreground hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="font-comic text-muted-foreground">
                    Drag & drop your file here or <span className="text-accent-blue underline">browse</span>
                  </p>
                  <p className="font-comic text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, PPT, PPTX up to 10MB</p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setUploadBranch('');
                  setUploadSemester('');
                  setUploadType('');
                  setResourceName('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="btn-sketch px-4 py-2 font-comic"
                disabled={uploadProgress}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadProgress || !uploadBranch || !uploadSemester || !uploadType || !resourceName.trim() || !selectedFile}
                className="btn-sketch px-6 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 font-hand text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadProgress ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload! 🚀'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {loading && resources.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 size={32} className="animate-spin mx-auto mb-2 text-primary" />
            <p className="font-comic text-muted-foreground">Loading resources...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  title={resource.title}
                  branch={resource.branch}
                  semester={resource.semester}
                  type={resource.type}
                  author={resource.user_profile?.display_name || resource.user_profile?.username || 'Anonymous'}
                  downloads={resource.downloads}
                  likes={resource.likes_count || 0}
                  uploadedAt={formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
                  isLiked={resource.is_liked}
                  userId={resource.user_id}
                  onDelete={() => loadResources(true)}
                />
              ))}
            </div>

            {resources.length === 0 && (
              <div className="text-center py-12">
                <p className="font-hand text-2xl text-muted-foreground">No resources found 😅</p>
                <p className="font-comic text-muted-foreground mt-2">Try adjusting your filters or be the first to share!</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && resources.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="btn-sketch px-8 py-3 font-hand text-xl bg-ink/5 hover:bg-ink/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Resources ↓'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ResourcesSection;
