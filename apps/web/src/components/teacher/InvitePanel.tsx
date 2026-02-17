"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authLogger } from "@/lib/auth-logger";
import { clientLogger } from "@/lib/client-logger";
import { QR_CODE_COLORS } from "@/lib/constants/theme-colors";

interface InvitePanelProps {
  readonly classCode: string;
  readonly joinPin: string;
  readonly className: string;
}

export function InvitePanel({
  classCode,
  joinPin,
  className,
}: InvitePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [origin, setOrigin] = useState("");

  // Set origin client-side only (globalThis.location is undefined during SSR)
  useEffect(() => {
    queueMicrotask(() => setOrigin(globalThis.location.origin));
  }, []);

  useEffect(() => {
    if (canvasRef.current && classCode && origin) {
      // Generate invite link with properly encoded parameters
      const params = new URLSearchParams({
        code: classCode,
        pin: joinPin,
        via: "invite",
      });
      const joinUrl = `${origin}/join?${params.toString()}`;

      // Generate QR code with high error correction for better scanning reliability
      QRCode.toCanvas(
        canvasRef.current,
        joinUrl,
        {
          errorCorrectionLevel: "H", // High error correction for printed/low-quality scans
          width: 256,
          margin: 2,
          color: {
            dark:
              getComputedStyle(document.documentElement)
                .getPropertyValue("--color-primary")
                .trim() || QR_CODE_COLORS.dark,
            light: QR_CODE_COLORS.light,
          },
        },
        (error) => {
          if (error) {
            authLogger.error("[InvitePanel] QR Code generation error", error);
            toast.error("Failed to generate QR code");
          } else {
            setQrGenerated(true);
          }
        },
      );
    }
  }, [classCode, joinPin, origin]);

  const getInviteLink = () => {
    if (!origin) return `/join?code=${classCode}&pin=${joinPin}&via=invite`;
    const params = new URLSearchParams({
      code: classCode,
      pin: joinPin,
      via: "invite",
    });
    return `${origin}/join?${params.toString()}`;
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      toast.success("Invite link copied to clipboard!");
    } catch (error) {
      clientLogger.error(
        "[InvitePanel] Failed to copy invite link",
        error instanceof Error ? error : { error: String(error) },
      );
      toast.error("Failed to copy invite link");
    }
  };

  const shareOnWhatsApp = () => {
    const inviteLink = getInviteLink();
    const message = `Join my ${className} class on ATAL AI!\n\n🔗 Click here to join: ${inviteLink}\n\nOr use:\n📝 Class Code: ${classCode}\n🔒 PIN: ${joinPin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    globalThis.open(whatsappUrl, "_blank");
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      clientLogger.error(
        "[InvitePanel] Failed to copy to clipboard",
        error instanceof Error ? error : { error: String(error) },
      );
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${className.replaceAll(/\s+/, "_")}_QR_Code.png`;
      link.href = url;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-responsive">
      <div className="mb-4 md:mb-6">
        <h2 className="heading-3 text-text-primary">Student Invitation</h2>
        <p className="text-sm text-text-secondary mt-1">
          Share these codes with students to join your class
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
        {/* QR Code Section */}
        <div className="space-y-4 order-2 md:order-1">
          <div className="flex flex-col items-center">
            <span className="mb-2 text-sm font-medium">QR Code</span>
            <div className="qr-container bg-white p-3 md:p-4 rounded-lg border-2 border-primary/30 shadow-sm">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
            <p className="text-xs text-text-muted mt-2 text-center max-w-[256px]">
              Students can scan this to auto-fill the class code
            </p>
          </div>

          {qrGenerated && (
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full touch-target"
            >
              Download QR Code
            </Button>
          )}
        </div>

        {/* Codes Section */}
        <div className="space-y-4 md:space-y-6 order-1 md:order-2">
          {/* Class Code */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Class Code</span>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg p-3 md:p-4">
              <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-center text-primary tracking-widest break-all">
                {classCode}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(classCode, "Class code")}
              variant="outline"
              size="sm"
              className="w-full touch-target"
            >
              📋 Copy Class Code
            </Button>
            <p className="text-xs text-text-muted">
              Students will enter this 6-character code
            </p>
          </div>

          {/* Join PIN */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Join PIN</span>
            <div className="bg-gradient-to-br from-primary-lighter to-primary-light border-2 border-primary/30 rounded-lg p-3 md:p-4">
              <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-center text-primary tracking-widest">
                {joinPin}
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(joinPin, "PIN")}
              variant="outline"
              size="sm"
              className="w-full touch-target"
            >
              📋 Copy PIN
            </Button>
            <p className="text-xs text-text-muted">
              4-digit PIN for class security
            </p>
          </div>
        </div>
      </div>

      {/* Invite Link Section */}
      <div className="mt-4 md:mt-6 space-y-4">
        <div className="bg-gradient-to-br from-success-light/50 to-success-light/30 border-2 border-success/30 rounded-lg p-responsive">
          <span className="text-sm font-medium mb-2 block">
            Direct Invite Link
          </span>
          <div className="bg-white rounded-md p-2 mb-3 border border-success/20 overflow-x-auto">
            <p className="text-xs font-mono text-text-secondary break-all">
              {getInviteLink()}
            </p>
          </div>
          <div className="btn-stack">
            <Button
              onClick={copyInviteLink}
              variant="outline"
              className="w-full touch-target bg-white hover:bg-success-light/30 border-success/30"
            >
              📋 Copy Invite Link
            </Button>
            <Button
              onClick={shareOnWhatsApp}
              className="w-full touch-target bg-whatsapp hover:bg-whatsapp-dark text-white border-0"
            >
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="truncate">Share on WhatsApp</span>
            </Button>
          </div>
          <p className="text-xs text-success-dark mt-2">
            <strong>✨ Best for sharing:</strong> This link auto-fills
            everything and allows anonymous guest access
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-warning-light/50 border-l-4 border-warning p-3 md:p-4 rounded">
          <p className="text-sm text-warning-dark">
            <strong>💡 How it works:</strong> When students click the invite
            link, they can join as a guest instantly or use phone OTP. No email
            required! They can add their email/phone later from Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
