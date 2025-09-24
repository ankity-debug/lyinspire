'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  contentUrl: z.string().url('Please enter a valid URL'),
  submitterName: z.string().min(1, 'Your name is required').max(100, 'Name must be less than 100 characters'),
  submitterEmail: z.string().email('Please enter a valid email address'),
  platform: z.string().min(1, 'Platform is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(10, 'Maximum 10 tags allowed'),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

const platforms = ['Behance', 'Dribbble', 'Medium', 'Core77', 'Awwwards', 'Other'];
const suggestedTags = [
  'UI Design', 'Web Design', 'Mobile App', 'Branding', 'Typography',
  'Illustration', 'Photography', 'Product Design', 'UX Research', 'Animation',
  'Logo Design', 'Print Design', 'Packaging', 'Interior Design', 'Architecture'
];

export function SubmissionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      tags: [],
    },
  });

  const addTag = (tag: string) => {
    if (selectedTags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }
    
    if (!selectedTags.includes(tag) && tag.trim()) {
      const newTags = [...selectedTags, tag.trim()];
      setSelectedTags(newTags);
      setValue('tags', newTags);
    }
    setCustomTag('');
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: SubmissionFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      toast.success('Submission received! We\'ll review it and get back to you soon.');
      reset();
      setSelectedTags([]);
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Design Inspiration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter the design title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select onValueChange={(value) => setValue('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-destructive">{errors.platform.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentUrl">URL *</Label>
            <Input
              id="contentUrl"
              type="url"
              {...register('contentUrl')}
              placeholder="https://..."
            />
            {errors.contentUrl && (
              <p className="text-sm text-destructive">{errors.contentUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the design..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submitterName">Your Name *</Label>
              <Input
                id="submitterName"
                {...register('submitterName')}
                placeholder="John Doe"
              />
              {errors.submitterName && (
                <p className="text-sm text-destructive">{errors.submitterName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterEmail">Your Email *</Label>
              <Input
                id="submitterEmail"
                type="email"
                {...register('submitterEmail')}
                placeholder="john@example.com"
              />
              {errors.submitterEmail && (
                <p className="text-sm text-destructive">{errors.submitterEmail.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Tags * (Select or add custom tags)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose relevant tags or add your own. Maximum 10 tags.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(customTag);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(customTag)}
                disabled={!customTag.trim() || selectedTags.length >= 10}
              >
                Add
              </Button>
            </div>

            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Tags ({selectedTags.length}/10):</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}