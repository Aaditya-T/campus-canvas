import { useState } from 'react';
import { Upload, Search, BookOpen, Filter } from 'lucide-react';
import ResourceCard from './ResourceCard';

const branches = [
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

const resourceTypes = ['PYQ', 'Notes', 'Book', 'Slides'];

const mockResources = [
  {
    id: 1,
    title: 'Data Structures PYQ 2023',
    branch: 'Computer Science',
    semester: '3',
    type: 'PYQ',
    author: 'Anonymous',
    downloads: 234,
    likes: 45,
    uploadedAt: '2 days ago',
  },
  {
    id: 2,
    title: 'Digital Electronics Notes Ch 1-5',
    branch: 'Electronics',
    semester: '4',
    type: 'Notes',
    author: 'TechNerd42',
    downloads: 189,
    likes: 67,
    uploadedAt: '1 week ago',
  },
  {
    id: 3,
    title: 'Engineering Mathematics III',
    branch: 'Computer Science',
    semester: '3',
    type: 'Book',
    author: 'MathWhiz',
    downloads: 456,
    likes: 123,
    uploadedAt: '3 days ago',
  },
  {
    id: 4,
    title: 'DBMS Lecture Slides',
    branch: 'Information Technology',
    semester: '5',
    type: 'Slides',
    author: 'ProfHelper',
    downloads: 321,
    likes: 89,
    uploadedAt: '5 days ago',
  },
  {
    id: 5,
    title: 'Thermodynamics PYQ Collection',
    branch: 'Mechanical',
    semester: '4',
    type: 'PYQ',
    author: 'MechHead',
    downloads: 156,
    likes: 34,
    uploadedAt: '1 day ago',
  },
  {
    id: 6,
    title: 'Operating Systems Complete Notes',
    branch: 'Computer Science',
    semester: '5',
    type: 'Notes',
    author: 'OSMaster',
    downloads: 567,
    likes: 201,
    uploadedAt: '4 days ago',
  },
];

const ResourcesSection = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload form state
  const [uploadBranch, setUploadBranch] = useState('');
  const [uploadSemester, setUploadSemester] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [resourceName, setResourceName] = useState('');

  const filteredResources = mockResources.filter((resource) => {
    const matchesBranch = !filterBranch || resource.branch === filterBranch;
    const matchesSemester = !filterSemester || resource.semester === filterSemester;
    const matchesSearch = !searchQuery || resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSemester && matchesSearch;
  });

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
                  onChange={(e) => setUploadType(e.target.value)}
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
                  className="w-full px-3 py-2 bg-paper border-2 border-ink/40 rounded-sm font-comic text-ink placeholder:text-muted-foreground focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-ink/40 rounded-sm p-6 text-center mb-4 bg-paper/50 hover:bg-paper transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-comic text-muted-foreground">
                Drag & drop your file here or <span className="text-accent-blue underline">browse</span>
              </p>
              <p className="font-comic text-xs text-muted-foreground mt-1">PDF, DOC, PPT up to 10MB</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadForm(false)}
                className="btn-sketch px-4 py-2 font-comic"
              >
                Cancel
              </button>
              <button className="btn-sketch px-6 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 font-hand text-lg">
                Upload! 🚀
              </button>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} {...resource} />
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="font-hand text-2xl text-muted-foreground">No resources found 😅</p>
            <p className="font-comic text-muted-foreground mt-2">Try adjusting your filters or be the first to share!</p>
          </div>
        )}

        {/* Load More */}
        {filteredResources.length > 0 && (
          <div className="text-center mt-8">
            <button className="btn-sketch px-8 py-3 font-hand text-xl bg-ink/5 hover:bg-ink/10">
              Load More Resources ↓
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourcesSection;
