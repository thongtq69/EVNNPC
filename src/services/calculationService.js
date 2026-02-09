export class ElectricityCalculationService {
    constructor(prices) {
        this.prices = {
            vatRate: prices.vat || 0.08,
            donGiaSanXuat: prices.production || 1896,
            donGiaKinhDoanh: prices.business || 3007,
            donGiaHCSNBenhVien: prices.hcsn_hospital || 1977,
            donGiaHCSNChieuSang: prices.hcsn_lighting || 2124,
            SinhHoatBacThang: {
                bac1: { price: prices.tier1 || 1893 },
                bac2: { price: prices.tier2 || 1956 },
                bac3: { price: prices.tier3 || 2271 },
                bac4: { price: prices.tier4 || 2860 },
                bac5: { price: prices.tier5 || 3197 },
                bac6: { price: prices.tier6 || 3302 }
            }
        };
    }

    tinhChenhLech(info) {
        let finalResult = {
            tongTienDungGia: 0,
            tongTienDaTinh: 0,
            diff: 0,
            chiTietTheoThang: [],
        };

        for (const month of info.months) {
            const kqDungGia = this.tinhTienPhucHop(
                month.consumption,
                month.otherFee,
                month.tyLeReality,
                info.soHoReality
            );

            const kqDaApDung = this.tinhTienPhucHop(
                month.consumption,
                month.otherFee,
                month.tyLeApplied,
                info.soHoApplied
            );

            finalResult.tongTienDungGia += kqDungGia.tongTien;
            finalResult.tongTienDaTinh += kqDaApDung.tongTien;
            finalResult.diff += kqDungGia.tongTien - kqDaApDung.tongTien;

            finalResult.chiTietTheoThang.push({
                id: Math.random().toString(),
                tenThang: month.name,
                sanLuongTotal: month.consumption,
                tienDungGia: kqDungGia.tongTien,
                chiTietBac: kqDungGia.chiTietBac,
                chiTietNhom: kqDungGia.chiTietNhom
            });
        }

        return finalResult;
    }

    tinhTienPhucHop(sanLuong, phiKhac, tyLe, soHo) {
        const vatRate = this.prices.vatRate;
        const sanLuongSH = sanLuong * (tyLe.tyLeSinhHoat || 0);
        const sanLuongSX = sanLuong * (tyLe.tyLeSanXuat || 0);
        const sanLuongKD = sanLuong * (tyLe.tyLeKinhDoanh || 0);
        const sanLuongHCSNBenhVien = sanLuong * (tyLe.tyLeHCSNBenhVien || 0);
        const sanLuongHCSNChieuSang = sanLuong * (tyLe.tyLeHCSNChieuSang || 0);

        const tienSH = this.tinhTienSinhHoat(sanLuongSH, soHo);
        const tienSX = sanLuongSX * this.prices.donGiaSanXuat;
        const tienKD = sanLuongKD * this.prices.donGiaKinhDoanh;
        const tienHCSNBenhVien = sanLuongHCSNBenhVien * this.prices.donGiaHCSNBenhVien;
        const tienHCSNChieuSang = sanLuongHCSNChieuSang * this.prices.donGiaHCSNChieuSang;

        const tongTruocVAT = tienSH.tienTruocVAT + tienSX + tienKD + tienHCSNBenhVien + tienHCSNChieuSang;
        const tongVAT = tienSH.tienVAT + (tienSX + tienKD + tienHCSNBenhVien + tienHCSNChieuSang) * vatRate;
        const tongTien = tongTruocVAT + tongVAT + (Number(phiKhac) || 0);

        const chiTietNhom = [
            { tenNhom: "SHBT", tyLe: tyLe.tyLeSinhHoat, kWh: sanLuongSH, tienTruocVAT: tienSH.tienTruocVAT, tongTien: tienSH.tienTruocVAT + tienSH.tienVAT },
            { tenNhom: "SXBT", tyLe: tyLe.tyLeSanXuat, kWh: sanLuongSX, tienTruocVAT: tienSX, tongTien: tienSX * (1 + vatRate) },
            { tenNhom: "KDDV", tyLe: tyLe.tyLeKinhDoanh, kWh: sanLuongKD, tienTruocVAT: tienKD, tongTien: tienKD * (1 + vatRate) },
            { tenNhom: "HCSN(BV)", tyLe: tyLe.tyLeHCSNBenhVien, kWh: sanLuongHCSNBenhVien, tienTruocVAT: tienHCSNBenhVien, tongTien: tienHCSNBenhVien * (1 + vatRate) },
            { tenNhom: "HCSN(CS)", tyLe: tyLe.tyLeHCSNChieuSang, kWh: sanLuongHCSNChieuSang, tienTruocVAT: tienHCSNChieuSang, tongTien: tienHCSNChieuSang * (1 + vatRate) }
        ];

        return { tongTien, chiTietBac: tienSH.chiTietBac, chiTietNhom };
    }

    tinhTienSinhHoat(sanLuong, soHo) {
        const vatRate = this.prices.vatRate;

        if (soHo === 0) {
            const price = this.prices.SinhHoatBacThang.bac3.price;
            const tien = sanLuong * price;
            const chiTietBac = [{ tenBac: "Bậc 3 (Không KK)", kWh: sanLuong, donGia: price, tien: tien }];
            return { tienTruocVAT: tien, tienVAT: tien * vatRate, chiTietBac };
        }

        const multi = Math.max(1, soHo);
        const dms = [
            { limit: 50 * multi, price: this.prices.SinhHoatBacThang.bac1.price, label: "Bậc 1" },
            { limit: 50 * multi, price: this.prices.SinhHoatBacThang.bac2.price, label: "Bậc 2" },
            { limit: 100 * multi, price: this.prices.SinhHoatBacThang.bac3.price, label: "Bậc 3" },
            { limit: 100 * multi, price: this.prices.SinhHoatBacThang.bac4.price, label: "Bậc 4" },
            { limit: 100 * multi, price: this.prices.SinhHoatBacThang.bac5.price, label: "Bậc 5" },
            { limit: Infinity, price: this.prices.SinhHoatBacThang.bac6.price, label: "Bậc 6" }
        ];

        let tienTruocVAT = 0;
        let chiTietBac = [];
        let remaining = sanLuong;

        for (const dm of dms) {
            if (remaining <= 0) break;
            const tieuThu = Math.min(remaining, dm.limit);
            const tien = tieuThu * dm.price;
            chiTietBac.push({ tenBac: dm.label, kWh: tieuThu, donGia: dm.price, tien: tien });
            tienTruocVAT += tien;
            remaining -= tieuThu;
        }

        return { tienTruocVAT, tienVAT: tienTruocVAT * vatRate, chiTietBac };
    }
}

export const PRICE_PERIODS = {
    'before_05_2025': { id: 'before_05_2025', name: 'Trước tháng 5/2025', shortName: 'Trước 5/2025' },
    'from_05_2025': { id: 'from_05_2025', name: 'Hiện tại', shortName: 'Hiện tại' }
};

export const DEFAULT_PRICES = {
    'before_05_2025': {
        tier1: 1893, tier2: 1956, tier3: 2271, tier4: 2860, tier5: 3197, tier6: 3302,
        production: 1896, business: 3007, hcsn_hospital: 1977, hcsn_lighting: 2124, vat: 0.08
    },
    'from_05_2025': {
        tier1: 1893, tier2: 1956, tier3: 2271, tier4: 2860, tier5: 3197, tier6: 3302,
        production: 1920, business: 3100, hcsn_hospital: 2000, hcsn_lighting: 2150, vat: 0.08
    }
};
