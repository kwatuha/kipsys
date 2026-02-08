"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye, Plus, AlertCircle, Loader2, Trash2, Upload } from "lucide-react"
import { patientApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth/auth-context"

type Document = {
  documentId: number
  documentName: string
  documentType?: string
  category?: string
  uploadDate: string
  uploadedBy?: number
  uploadedByFirstName?: string
  uploadedByLastName?: string
  fileSize?: number
  mimeType?: string
  notes?: string
}

export function PatientDocuments({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "",
    category: "",
    notes: "",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadDocuments()
  }, [patientId])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const docs = await patientApi.getDocuments(patientId)
      setDocuments(docs)
    } catch (err: any) {
      console.error("Error loading documents:", err)
      setError(err.message || "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = () => {
    setFormOpen(true)
    setFormError(null)
    setSelectedFile(null)
    setFormData({
      documentName: "",
      documentType: "",
      category: "",
      notes: "",
    })
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setFormError(null)
    setSelectedFile(null)
    setFormData({
      documentName: "",
      documentType: "",
      category: "",
      notes: "",
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        setFormError("File size must be less than 10MB")
        return
      }
      setSelectedFile(file)
      setFormError(null)
      // Auto-fill document name if empty
      if (!formData.documentName) {
        setFormData({ ...formData, documentName: file.name })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!selectedFile) {
      setFormError("Please select a file to upload")
      return
    }

    if (!formData.documentName.trim()) {
      setFormError("Document name is required")
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("documentName", formData.documentName.trim())
      uploadFormData.append("documentType", formData.documentType || formData.category || "")
      uploadFormData.append("category", formData.category || formData.documentType || "")
      uploadFormData.append("uploadDate", format(new Date(), "yyyy-MM-dd"))
      uploadFormData.append("notes", formData.notes.trim() || "")
      if (user?.id) {
        uploadFormData.append("uploadedBy", user.id.toString())
      }

      await patientApi.createDocument(patientId, uploadFormData)
      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      })

      handleCloseForm()
      loadDocuments()
    } catch (err: any) {
      console.error("Error uploading document:", err)
      const errorMessage = err.message || "Failed to upload document"
      setFormError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (document: Document) => {
    if (!document.documentId) return
    const downloadUrl = patientApi.downloadDocument(patientId, document.documentId.toString())
    window.open(downloadUrl, '_blank')
  }

  const handleView = (document: Document) => {
    if (!document.documentId) return
    const downloadUrl = patientApi.downloadDocument(patientId, document.documentId.toString())
    window.open(downloadUrl, '_blank')
  }

  const handleDelete = async (document: Document) => {
    if (!document.documentId) return

    if (!confirm(`Are you sure you want to delete "${document.documentName}"?`)) {
      return
    }

    try {
      await patientApi.deleteDocument(patientId, document.documentId.toString())
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      })
      loadDocuments()
    } catch (err: any) {
      console.error("Error deleting document:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getUploadedByName = (doc: Document) => {
    if (doc.uploadedByFirstName || doc.uploadedByLastName) {
      return `${doc.uploadedByFirstName || ''} ${doc.uploadedByLastName || ''}`.trim()
    }
    return "Unknown"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Medical Documents</h3>
            <Button size="sm" onClick={handleOpenForm}>
              <Plus className="h-4 w-4 mr-1" />
              Upload Document
            </Button>
          </div>

          {documents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.documentId}>
                      <TableCell className="font-medium">{doc.documentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.category || doc.documentType || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(doc.uploadDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{doc.mimeType?.split('/')[1]?.toUpperCase() || "N/A"}</TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>{getUploadedByName(doc)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded for this patient
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a medical document for this patient. Maximum file size: 10MB
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {formError}
              </div>
            )}

            <div>
              <Label htmlFor="file">File *</Label>
              <div className="mt-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dicom"
                  required
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                required
                placeholder="e.g., Discharge Summary - Jan 2023"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Discharge Summary">Discharge Summary</SelectItem>
                    <SelectItem value="Diagnostic Report">Diagnostic Report</SelectItem>
                    <SelectItem value="Imaging">Imaging</SelectItem>
                    <SelectItem value="Laboratory Report">Laboratory Report</SelectItem>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                    <SelectItem value="Procedure Report">Procedure Report</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Optional category"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this document..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
