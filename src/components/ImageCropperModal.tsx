
'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropperModalProps {
  imageSrc: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: string) => void;
}

export default function ImageCropperModal({ imageSrc, isOpen, onClose, onCropComplete }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.src = imageSrc;

      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const size = 400; // Final target size
      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          size,
          size
        );
      }

      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      onCropComplete(base64Image);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-card border-none rounded-[2.5rem] p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/5">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-white">Sesuaikan Foto</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full aspect-square bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1 / 1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={handleCropComplete}
              classes={{
                containerClassName: 'bg-black',
                mediaClassName: 'object-contain',
              }}
            />
          )}
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-white/40 tracking-widest">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
              className="py-4"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl text-[10px] font-black uppercase">Batal</Button>
            <Button onClick={createCroppedImage} className="flex-1 neon-gradient text-background rounded-2xl glow-primary text-[10px] font-black uppercase">Gunakan Foto</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
