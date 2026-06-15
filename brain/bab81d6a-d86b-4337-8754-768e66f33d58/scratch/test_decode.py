import base64

s = "gaonrnKcVIkvVi/H5V+/Uh9Xj+UcPDKpLzNWrBxMSndbWY7rWK4viwzd8rftn+nVJarJ4J7wUclXFxwGTg809Y3d96zzJLKWilOWuQX/z8dBjW712VUn1DXzVHA8t8NdaW0hqslR1/CV6Dt9SJVePJxVi58PHv0LX1cTuqDJL0yfbGTF/GF/QUYnMEIt0bmTnxuX9M+z9+hfUIbvaKYu83lt8VXv8AHTFoVGVDiBue7fjOFaJJtncn+Lin1UWj7vvYdN6WnA/NGTGKyvl5U3N/m3bnN/l+L6Q7LUYmWKIGFOXbT5lTT75567q68nFRQVpY1dNypcpfPI9BzZTt8LA4OvOUdhaMe3gGo1EZIQ031DXhtaUVW8q+DPdDUdn/AFJO42xilemItAmKb4qhwYWxa8oRfw6zUCUaj6ZqMqsu8Yb9zz0Kcl2G3ZcpsrxjHv8AauLzj4kad09RjqJE57hn1WhHtZpuWSFlXQRf4gCiqMedrg5EO6mAUgxieq8Sy+LMcYz0DdqZWRpkdzuki+i0MOZXZ96voEdQn+JjJWL28j6uPVxx7c89VY2ErnHQZfj2RO315TNsraqkxUpLSe7uzn/0PV+nTkNkIwuSzslOSCtrwPgMZ6BodyRntnGNO2rbiJjdLxRFUPDXTbq4LlVxjto2meFLxis8Px08QkY5pu8np630tzSBGehIImZkoi1+Vkn6YrP9ugfVPpWrGZl1N0pVK7yLd5w4+T562ZajHS2MHeSHxYJyeRx+x46WNdTyoxb8FPOM/wDo6YOhJULhhBuBpu36WJi/FV7bUNPSLjCUnL6QlyZvlMfzvzaRlT+coYkoxyZp8pnNfe/bq8YMtL8QkSk5r/WxbDan8JzfO5PD15+HaaurNcrK5Mm/1begADcrqbvFhLZOnXlnc/0tj6pLSlaLTmKPpvi2/n26Drk2BEmGhLa5TcYtqNvz8V+vSuv2W0hHdKTL8rdRvzV+KeccdPdv2pCDozgTmyqTdxiDx/2o+T3z1"

# pad if necessary
missing_padding = len(s) % 4
if missing_padding:
    s += '=' * (4 - missing_padding)

try:
    decoded = base64.b64decode(s)
    print("Decoded length:", len(decoded))
    print("First 20 bytes (hex):", decoded[:20].hex())
except Exception as e:
    print("Error:", e)
