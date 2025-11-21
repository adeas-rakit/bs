{pkgs}: {
  channel = "stable-25.05";
  packages = [
    pkgs.nodejs_24,
    pkgs.python3
  ];
  idx.extensions = [
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  }; 
}