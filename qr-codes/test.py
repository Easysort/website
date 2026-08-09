#!/usr/bin/env python3

import qrcode

img = qrcode.make("https://easysort.org/argo/jyllinge")
img.save("qr-codes/qr-argo-jyllinge.png")