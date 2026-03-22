'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, FileText, Loader2, ScanLine, Save, ArrowLeft, CheckCircle2, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clearanceService } from '@/services/clearanceService';
import { Clearance } from '@/types/clearance';

type SubmittedDocument = {
  name: string;
  submittedAt: string;
};

type DocumentValidationResult = {
  isMatch: boolean;
  confidence: number;
  matchedKeywords: string[];
};

type DocumentTypeRules = Record<string, string[]>;

const DOCUMENT_TYPE_RULES: DocumentTypeRules = {
  'ICT Device Return Slip': ['device return', 'ict office', 'asset tag'],
  'Library Clearance Form': ['library', 'borrowed books', 'return slip'],
  'Laboratory Tools Return Checklist': ['laboratory', 'tools', 'checklist'],
  'CESO Completion Certificate': ['ceso', 'completion certificate', 'completed'],
  'Financial Clearance': ['financial clearance', 'cashier', 'no outstanding balance'],
  'PMO Equipment Return': ['pmo', 'equipment return', 'property management office'],
  'Program Chair Clearance': ['program chair', 'clearance', 'department'],
  'Borrowed Book Slip': ['borrowed book slip', 'borrowed books slip', 'borrowed book', 'library', 'book return', 'dlrc'],
};

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_RULES);

const normalize = (value: string) => value.trim().toLowerCase().split(/\s+/).join(' ');

function validateDocument(selectedType: string, extractedText: string): DocumentValidationResult {
  const normalizedText = normalize(extractedText);
  const expectedKeywords = DOCUMENT_TYPE_RULES[selectedType] || [];

  if (expectedKeywords.length === 0) {
    return {
      isMatch: false,
      confidence: 0,
      matchedKeywords: [],
    };
  }

  const matchedKeywords = expectedKeywords.filter((keyword) => normalizedText.includes(normalize(keyword)));
  const confidence = Math.round((matchedKeywords.length / expectedKeywords.length) * 100);
  const requiredMatches = Math.ceil(expectedKeywords.length * 0.6);

  return {
    isMatch: matchedKeywords.length >= requiredMatches,
    confidence,
    matchedKeywords,
  };
}

export default function FacultyDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = Array.isArray(params.employeeId) ? params.employeeId[0] : params.employeeId;

  const [records, setRecords] = useState<Clearance[]>([]);
  const [loading, setLoading] = useState(true);

  const [facultyDocuments, setFacultyDocuments] = useState<SubmittedDocument[]>([]);
  const [dlrcNotes, setDlrcNotes] = useState('');
  const [selectedOCRFile, setSelectedOCRFile] = useState<File | null>(null);
  const [selectedOCRDocumentType, setSelectedOCRDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await clearanceService.getClearances();
      setRecords(data);
      setLoading(false);
    };

    void load();
  }, []);

  const facultyRecord = useMemo(() => {
    return records.find((record) => record.employeeId === employeeId);
  }, [records, employeeId]);

  const facultyDocumentsData = useMemo(() => {
    if (!facultyRecord) return [];
    
    const storageKey = `faculty-documents-${employeeId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as SubmittedDocument[];
    } catch {
      return [];
    }
  }, [facultyRecord, employeeId]);

  const dlrcNotesData = useMemo(() => {
    if (!facultyRecord) return '';
    
    const storageKey = `faculty-dlrc-notes-${employeeId}`;
    return localStorage.getItem(storageKey) || '';
  }, [facultyRecord, employeeId]);

  useEffect(() => {
    setFacultyDocuments(facultyDocumentsData);
    setDlrcNotes(dlrcNotesData);
  }, [facultyDocumentsData, dlrcNotesData]);

  const saveDlrcNotes = () => {
    const storageKey = `faculty-dlrc-notes-${employeeId}`;
    localStorage.setItem(storageKey, dlrcNotes);
  };

  const handleOCRDocumentTypeChange = (value: string | null) => {
    setSelectedOCRDocumentType(value ?? DOCUMENT_TYPES[0]);
  };

  const handleRunOCR = async () => {
    if (!selectedOCRFile) {
      return;
    }

    setIsOCRLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedOCRFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'OCR request failed');
      }

      const extractedText = payload.text || '';
      const result = validateDocument(selectedOCRDocumentType, extractedText);

      setOcrText(extractedText);
      setValidationResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process OCR.';
      setOcrText(`OCR scan failed: ${message}`);
      setValidationResult(null);
    } finally {
      setIsOCRLoading(false);
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'pending') => {
    if (!facultyRecord) return;
    
    setActionLoadingId(facultyRecord.id);
    await clearanceService.updateClearanceStatus(facultyRecord.id, decision);
    
    const data = await clearanceService.getClearances();
    setRecords(data);
    setActionLoadingId(null);
  };

  const getStatusClass = (status: Clearance['status']) => {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-800';
    if (status === 'submitted') return 'bg-red-100 text-red-800';
    if (status === 'rejected') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-red-500" />
        Loading faculty details...
      </div>
    );
  }

  if (!facultyRecord) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <p>Faculty clearance record not found.</p>
        <Link href="/clearance" className="text-red-600 hover:underline mt-4 inline-block">
          Back to Clearance
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{facultyRecord.employeeName}</h1>
          <p className="text-slate-500 mt-1">Clearance review and document verification (DLRC).</p>
        </div>
        <Link href="/clearance" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Back to Clearance
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusClass(facultyRecord.status)}`}>
              {facultyRecord.status === 'approved' && <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
              {facultyRecord.status}
            </span>
            <p className="text-sm text-slate-600">Submission date: {facultyRecord.submissionDate || 'Not submitted'}</p>
            {facultyRecord.validationWarning && (
              <p className="text-sm text-rose-600">AI note: {facultyRecord.validationWarning}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>DLRC Review Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button 
                onClick={() => void handleDecision('approved')} 
                disabled={actionLoadingId === facultyRecord.id || facultyRecord.status === 'approved'}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoadingId === facultyRecord.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve Clearance
              </Button>
              <Button 
                onClick={() => void handleDecision('rejected')} 
                disabled={actionLoadingId === facultyRecord.id || facultyRecord.status === 'rejected'}
                variant="destructive"
                className="w-full"
              >
                {actionLoadingId === facultyRecord.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Reject Clearance
              </Button>
              <Button 
                onClick={() => void handleDecision('pending')} 
                disabled={actionLoadingId === facultyRecord.id || facultyRecord.status === 'pending'}
                variant="outline"
                className="w-full"
              >
                {actionLoadingId === facultyRecord.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                Mark as Pending
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>DLRC Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-red-500"
              value={dlrcNotes}
              onChange={(event) => setDlrcNotes(event.target.value)}
              placeholder="Add review notes, concerns, or observations..."
            />
            <Button onClick={saveDlrcNotes} className="bg-red-600 hover:bg-red-700">
              <Save className="mr-2 h-4 w-4" /> Save Notes
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {facultyDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">No documents submitted yet.</p>
            ) : (
              facultyDocuments.map((document, index) => (
                <div key={`${document.name}-${index}`} className="rounded-md border border-slate-200 p-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-700">{document.name}</div>
                      <div className="text-xs text-slate-500">Submitted: {document.submittedAt}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle>OCR AI Scanner - Document Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="ocr-document-type" className="text-sm font-medium text-slate-700">Document Type</label>
              <Select value={selectedOCRDocumentType} onValueChange={handleOCRDocumentTypeChange}>
                <SelectTrigger id="ocr-document-type" className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input type="file" onChange={(event) => setSelectedOCRFile(event.target.files?.[0] || null)} />
            <Button onClick={() => void handleRunOCR()} disabled={isOCRLoading} className="bg-red-600 hover:bg-red-700">
              {isOCRLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />} Run OCR AI Scan
            </Button>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Selected Type: <span className="text-slate-700 normal-case">{selectedOCRDocumentType}</span>
              </div>

              {validationResult && (
                <div className="mb-3 rounded-md border border-slate-200 bg-white p-3 text-sm">
                  <p className="text-slate-700">
                    Matched Document Type: {validationResult.isMatch ? '✅' : '❌'}
                  </p>
                  <p className="text-slate-700">Confidence Score: {validationResult.confidence}%</p>
                  <p className="text-slate-700">
                    Detected Keywords: {validationResult.matchedKeywords.length > 0 ? validationResult.matchedKeywords.join(', ') : 'None'}
                  </p>
                  {!validationResult.isMatch && (
                    <p className="mt-2 flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Uploaded document does not match selected type
                    </p>
                  )}
                </div>
              )}

              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4" /> Extracted Text
              </div>
              <pre className="whitespace-pre-wrap text-xs text-slate-600">{ocrText || 'No OCR output yet.'}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
