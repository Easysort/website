#!/usr/bin/env python3

import qrcode

img = qrcode.make("https://easysort.org/argo/roskilde")
img.save("qr-codes/qr-argo-roskilde.png")