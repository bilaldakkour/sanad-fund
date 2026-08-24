import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "الشروط وحقوق الملكية — سَنَد",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex flex-col items-center pt-10 pb-8 px-6">
        <Logo size={48} />
        <p className="text-white font-black text-lg mt-3">سَنَد</p>
        <p className="text-orange-300 text-xs">صندوق التعاضد والتكاتف العائلي</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-t-3xl px-6 py-8 space-y-6 text-slate-700 text-sm leading-7">
        <div>
          <h1 className="text-xl font-black text-slate-900 mb-1">الشروط وحقوق الملكية</h1>
          <p className="text-xs text-slate-400">آخر تحديث: أغسطس ٢٠٢٦</p>
        </div>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">١. طبيعة الخدمة</h2>
          <p>
            «سَنَد» أداة داخلية غير تجارية بتخدم صندوق تعاضد وتكافل عائلي واحد. الاستخدام
            مقتصر حصرًا على أفراد العائلة يلي توافق عليهم إدارة الصندوق كأعضاء. التطبيق
            مش متاح للعموم ولا مخصص لأي غرض تجاري أو ربحي.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٢. حقوق الملكية</h2>
          <p>
            التطبيق وتصميمه واسمه وشعاره («سَنَد») ملك لإدارة صندوق التعاضد العائلي وأُنشئ
            حصرًا لخدمته. لا يجوز نسخ التطبيق أو تصميمه أو استخدامه لأي مشروع أو جهة أخرى
            بدون إذن صريح من إدارة الصندوق.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٣. مسؤولية العضو</h2>
          <ul className="list-disc pr-5 space-y-1">
            <li>تقديم معلومات صحيحة وكاملة عند التسجيل.</li>
            <li>عدم التصريح بتبرّع كاذب أو رفع إثبات تحويل غير حقيقي.</li>
            <li>الحفاظ على سرّية كلمة المرور وعدم مشاركة الحساب مع أي حدا تاني.</li>
            <li>احترام خصوصية باقي الأعضاء وعدم مشاركة معلومات السجل خارج نطاق العائلة.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٤. الأدوار والصلاحيات</h2>
          <p>
            التطبيق بيقسم الصلاحيات على أدوار مختلفة (عضو، جابي، مشرف، أمين صندوق، مدير)،
            كل دور بصلاحيات محدّدة توضّحها إدارة الصندوق. تغيير دور أي عضو قرار حصري بيد
            المدير.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٥. لا حذف للسجلات المالية</h2>
          <p>
            بموافقتك على استخدام التطبيق، إنت موافق إنو أي حركة مالية (تبرّع أو مصروف)
            بتسجّلها ما بتنحذف نهائيًا — أي تصحيح لاحق بيصير بالتعديل مع بقاء الأثر ظاهرًا
            للجميع، حفاظًا على شفافية ومصداقية سجل الصندوق.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٦. إخلاء المسؤولية</h2>
          <p>
            التطبيق مقدَّم «كما هو» بدون أي ضمانات. إدارة الصندوق بتبذل جهدها لضمان دقة
            البيانات وأمان الوصول، لكن ما بتتحمّل مسؤولية أي خلل تقني، انقطاع مؤقّت للخدمة،
            أو خطأ بشري بالتسجيل. الصندوق نفسه (الأموال والقرارات المالية) بيبقى بمسؤولية
            إدارة الصندوق مباشرة، بعيدًا عن التطبيق كأداة تقنية.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٧. إنهاء العضوية</h2>
          <p>
            يحق لإدارة الصندوق إنهاء عضوية أي مستخدم بأي وقت (خرق للشروط، أو بطلب العضو
            نفسه). عند الإنهاء، بيفقد العضو الوصول للتطبيق فورًا، بينما سجلّه المالي
            السابق بيضل محفوظًا بالسجل العام حفاظًا على الشفافية التاريخية.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-slate-900 mb-1.5">٨. التعديلات على هذه الشروط</h2>
          <p>يحق لإدارة الصندوق تعديل هذه الشروط بأي وقت. تاريخ آخر تحديث موجود فوق هالصفحة.</p>
        </section>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link href="/login" className="text-orange-600 font-bold">
            العودة لتسجيل الدخول
          </Link>
          <Link href="/privacy" className="text-slate-400 font-bold">
            سياسة الخصوصية
          </Link>
        </div>
      </div>
    </div>
  );
}
