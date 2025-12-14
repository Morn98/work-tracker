import { useState } from 'react';
import { PageContainer, Header, Card, Button, EmptyState } from '../components/ui';
import { saveProject, deleteProject } from '../lib/database';
import { useProjects } from '../hooks/useProjects';
import { showError, showSuccess } from '../utils/errorHandler';
import { DEFAULT_PROJECT_COLOR } from '../constants';
import type { Project } from '../types';

// Predefined color options for projects
const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Gray', value: '#6B7280' },
];

export const Projects = () => {
  const { projects, refresh } = useProjects();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: COLOR_OPTIONS[0].value });

  const handleOpenForm = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({ name: project.name, color: project.color || DEFAULT_PROJECT_COLOR });
    } else {
      setEditingProject(null);
      setFormData({ name: '', color: COLOR_OPTIONS[0].value });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    setFormData({ name: '', color: COLOR_OPTIONS[0].value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Please enter a project name');
      return;
    }

    const now = Date.now();
    const project: Project = {
      id: editingProject?.id || `project-${now}`,
      name: formData.name.trim(),
      color: formData.color,
      createdAt: editingProject?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveProject(project);
      await refresh();
      handleCloseForm();
      showSuccess(editingProject ? 'Project updated!' : 'Project created!');
    } catch {
      // Error already shown by database layer
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      await refresh();
      setDeleteConfirmId(null);
      showSuccess('Project deleted!');
    } catch {
      // Error already shown by database layer
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <PageContainer>
      <Header
        title="Projects"
        description="Manage your projects"
        action={!isFormOpen && <Button onClick={() => handleOpenForm()}>+ New Project</Button>}
      />

      {isFormOpen && (
        <Card className="mb-6" padding="lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Color
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-blue-500 ring-offset-2'
                        : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {COLOR_OPTIONS.find((c) => c.value === formData.color)?.name}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" fullWidth>
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCloseForm} fullWidth>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {projects.length === 0 && !isFormOpen ? (
        <Card>
          <EmptyState
            icon="📁"
            title="No projects yet"
            description="Create your first project to start tracking time. Projects help you organize and categorize your work."
            action={{
              label: 'Create Your First Project',
              onClick: () => handleOpenForm(),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} hover padding="md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || DEFAULT_PROJECT_COLOR }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h3>
                </div>
              </div>

              {deleteConfirmId === project.id ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Are you sure you want to delete this project?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(project.id)}
                      fullWidth
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCancelDelete}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenForm(project)}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteClick(project.id)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
