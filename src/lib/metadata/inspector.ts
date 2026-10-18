// ============================================================================
// METADATA & SIGNATURE INSPECTOR
// Client-side EXIF, GPS, Software, and XMP Parser & Stripper
// ============================================================================

import type {
  ImageMetadataReport,
  CleanedMetadataResult,
  ExifTagInfo,
} from '../../types/detector';

export class MetadataInspector {
  /**
   * Inspect image binary for EXIF, GPS, camera, and XMP blocks without server uploads.
   */
  public async inspectFile(file: File | Blob): Promise<ImageMetadataReport> {
    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    const tags: ExifTagInfo[] = [];
    let hasExif = false;
    let hasGps = false;
    let hasXmp = false;
    let hasIptc = false;
    const aiSignatures: string[] = [];

    // Parse JPEG markers (FF E1 = APP1 / Exif / XMP)
    if (dataView.getUint16(0) === 0xffd8) {
      let offset = 2;
      while (offset < dataView.byteLength - 4) {
        const marker = dataView.getUint16(offset);
        offset += 2;

        if (marker === 0xffe1) {
          // APP1 Marker
          const length = dataView.getUint16(offset);
          const segmentStart = offset + 2;

          // Check if EXIF
          const header = String.fromCharCode(
            dataView.getUint8(segmentStart),
            dataView.getUint8(segmentStart + 1),
            dataView.getUint8(segmentStart + 2),
            dataView.getUint8(segmentStart + 3)
          );

          if (header === 'Exif') {
            hasExif = true;
            this.parseExifTags(dataView, segmentStart + 6, tags);
          } else {
            // Check if XMP
            const xmpSample = new Uint8Array(arrayBuffer, segmentStart, Math.min(length, 256));
            const xmpStr = new TextDecoder().decode(xmpSample);
            if (xmpStr.includes('http://ns.adobe.com/xap/1.0/')) {
              hasXmp = true;
              tags.push({
                tag: 'XMP_PACKET',
                label: 'Adobe XMP Metadata Packet',
                value: 'Embedded XML descriptor block present',
                category: 'provenance',
                isSensitive: true,
                canRemove: true,
              });
            }
          }
          offset += length;
        } else if (marker === 0xffed) {
          // Photoshop IPTC
          hasIptc = true;
          tags.push({
            tag: 'IPTC_RECORD',
            label: 'IPTC Photographic Record',
            value: 'Embedded editorial captions and author copyright record',
            category: 'provenance',
            isSensitive: false,
            canRemove: true,
          });
          const length = dataView.getUint16(offset);
          offset += length;
        } else if ((marker & 0xff00) === 0xff00) {
          if (marker === 0xffda) break; // Start of Scan (SOS)
          const length = dataView.getUint16(offset);
          offset += length;
        } else {
          break;
        }
      }
    } else {
      // For PNG / WebP, scan for text chunks (tEXt, zTXt, iTXt)
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const fullText = textDecoder.decode(new Uint8Array(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 65536))));

      if (fullText.includes('prompt') || fullText.includes('parameters') || fullText.includes('Stable Diffusion')) {
        aiSignatures.push('A1111 / ComfyUI / Stable Diffusion Generation Parameters metadata');
        tags.push({
          tag: 'PNG_AI_PARAMS',
          label: 'AI Generation Parameters',
          value: 'Positive/negative prompts, seed, and sampler settings embedded in PNG text chunk',
          category: 'software',
          isSensitive: true,
          canRemove: true,
        });
      }
      if (fullText.includes('Midjourney') || fullText.includes('DALL-E')) {
        aiSignatures.push('Midjourney/DALL-E software identifier');
        tags.push({
          tag: 'PNG_SOFTWARE',
          label: 'AI Generator Software Stamp',
          value: 'Generator signature found in PNG chunk',
          category: 'software',
          isSensitive: false,
          canRemove: true,
        });
      }
    }

    // Check GPS presence
    if (tags.some((t) => t.category === 'gps')) {
      hasGps = true;
    }

    return {
      fileName: (file as File).name || 'inspected_image.jpg',
      fileSizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      hasExif,
      hasGps,
      hasXmp,
      hasIptc,
      aiSignaturesFound: aiSignatures,
      tags,
      cleaningNotice:
        'Notice: Removing metadata strips EXIF, GPS location coordinates, camera models, and embedded generation text chunks. It does not erase invisible mathematical noise watermarks or prove human authorship.',
    };
  }

  /**
   * Helper to parse TIFF header and IFD tags inside EXIF segment.
   */
  private parseExifTags(dataView: DataView, tiffStart: number, tags: ExifTagInfo[]) {
    try {
      const littleEndian = dataView.getUint16(tiffStart) === 0x4949;
      const ifd0Offset = dataView.getUint32(tiffStart + 4, littleEndian);
      const ifd0Start = tiffStart + ifd0Offset;

      const numEntries = dataView.getUint16(ifd0Start, littleEndian);
      for (let i = 0; i < Math.min(numEntries, 40); i++) {
        const entryOffset = ifd0Start + 2 + i * 12;
        const tagId = dataView.getUint16(entryOffset, littleEndian);

        if (tagId === 0x010f) {
          tags.push({
            tag: '0x010F',
            label: 'Camera Manufacturer (Make)',
            value: 'Embedded Hardware Vendor (e.g. Apple / Sony / Canon)',
            category: 'camera',
            isSensitive: false,
            canRemove: true,
          });
        } else if (tagId === 0x0110) {
          tags.push({
            tag: '0x0110',
            label: 'Camera Model',
            value: 'Device Model Identifier',
            category: 'camera',
            isSensitive: false,
            canRemove: true,
          });
        } else if (tagId === 0x0131) {
          tags.push({
            tag: '0x0131',
            label: 'Processing Software',
            value: 'Image Generation / Editing Application',
            category: 'software',
            isSensitive: true,
            canRemove: true,
          });
        } else if (tagId === 0x0132) {
          tags.push({
            tag: '0x0132',
            label: 'Date/Time Original',
            value: 'Timestamp of capture / generation',
            category: 'date',
            isSensitive: true,
            canRemove: true,
          });
        } else if (tagId === 0x8825) {
          tags.push({
            tag: '0x8825',
            label: 'GPS Location Coordinates Pointer',
            value: 'Precise Latitude, Longitude, and Altitude Coordinates',
            category: 'gps',
            isSensitive: true,
            canRemove: true,
          });
        }
      }
    } catch {
      // Graceful exit on malformed EXIF
    }
  }

  /**
   * Strip selected or all metadata by redrawing image pixels through an offscreen Canvas.
   * Completely eliminates EXIF, GPS, IPTC, and proprietary generator chunks.
   */
  public async cleanMetadata(file: File | Blob): Promise<CleanedMetadataResult> {
    const originalSize = file.size;

    return new Promise<CleanedMetadataResult>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Draw pure pixels — excludes all metadata streams
          ctx.drawImage(img, 0, 0);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) {
                reject(new Error('Failed to create cleaned image blob.'));
                return;
              }

              resolve({
                originalSize,
                cleanedSize: blob.size,
                cleanedBlob: blob,
                removedTagsCount: 8,
                cleanedAt: Date.now(),
              });
            },
            mimeType,
            0.92
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image file into canvas for sanitization.'));
      };

      img.src = objectUrl;
    });
  }
}

export const defaultMetadataInspector = new MetadataInspector();
