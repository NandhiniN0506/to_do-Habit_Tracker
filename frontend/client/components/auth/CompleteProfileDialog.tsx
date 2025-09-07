import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ProfileData = {
  name: string;
  dob: string;
  gender: "Male" | "Female" | "Prefer not to say";
};

export default function CompleteProfileDialog({
  open,
  onOpenChange,
  initialName,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName?: string | null;
  onSubmit: (data: ProfileData) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initialName || "");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<ProfileData["gender"] | undefined>(undefined);

  useEffect(() => {
    setName(initialName || "");
  }, [initialName]);

  function isValidName(n: string) {
    return /^[A-Za-z ]+$/.test(n.trim());
  }
  function isOldEnough(d: string) {
    if (!d) return false;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear() - (today < new Date(date.getFullYear() + (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate()) ? 1 : 0), date.getMonth(), date.getDate()) ? 1 : 0);
    return age >= 10;
  }

  const nameError = name && !isValidName(name) ? "Only letters and spaces allowed" : null;
  const dobError = dob && !isOldEnough(dob) ? "Must be at least 10 years old" : null;
  const genderError = !gender ? "Select a gender" : null;

  const disabled = submitting || !name || !dob || !gender || !!nameError || !!dobError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>We just need a few details to finish setting up your account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cp-name">Name</Label>
            <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Johnson" />
            {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cp-dob">Date of Birth</Label>
            <Input id="cp-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            {dobError ? <p className="text-xs text-destructive">{dobError}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label>Gender</Label>
            <Select value={gender as any} onValueChange={(v) => setGender(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {genderError && !gender ? <p className="text-xs text-destructive">{genderError}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button type="button" onClick={() => onSubmit({ name: name.trim(), dob, gender: gender! })} disabled={disabled}>{submitting ? "Saving..." : "Save & Continue"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
