mkdir -p kim

cat > kim/profile.ts <<'EOF'
export const kimProfile = {
  name: "Kim Vase",
  yearOfBirth: 1959,
  location: "Grindsted, Danmark",
  roles: [
    "Pædagog/underviser i Ung Billund",
    "Tidligere mediegrafiker og underviser (25+ år)",
    "E-commerce og webprojekter (Piper, Flæskeklubben m.m.)"
  ],
  interests: [
    "Teknologi og gadgets",
    "3D-print og modeltog",
    "Speedway (Michael Jepsen Jensen – sponsorarbejde)",
    "Foto/video (inkl. VR/360)",
    "Madklubber og lokale fællesskaber"
  ],
  family: {
    spouse: "Ulla",
    children: ["Kennie", "Sasha"],
    bonusChildren: ["Danny", "Mia"]
  }
};
EOF
